// src/components/MessageComposition.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Smile,
    AtSign,
    Paperclip,
    X,
    Upload,
    Send,
    Check,
    AlertCircle,
    Bell,
    BellOff,
    Users,
    MessageSquare
} from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import EmojiPickerWrapper from './EmojiPickerWrapper';

import { useDrafts } from '../../../hooks/useDrafts';

const MessageComposition = ({ 
    onSendMessage, 
    channelId, 
    threadId = null, 
    placeholder,
    mode = 'message', // 'message', 'comment', 'task', 'edit'
    initialContent = '',
    initialAttachments = [],
    showFileUpload = true,
    showEmoji = true,
    showMentions = true,
    compact = false,
    maxLength = null,
    disabled = false,
    isLoading = false,
    onCancel = null,
    editMessage = null,
    showThreadContext = false,
    threadSummary = null,
    originalMessage = null,
    className = ''
}) => {
    const [message, setMessage] = useState(initialContent);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [attachedFiles, setAttachedFiles] = useState(initialAttachments);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [error, setError] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [isFollowing, setIsFollowing] = useState(true);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef(null);
    const richEditorRef = useRef(null);
    const autoSaveTimeoutRef = useRef(null);
    const emojiButtonRef = useRef(null);

    const { getDraft, saveDraft, clearDraft, hasDraft } = useDrafts();

    const users = [
        { id: 1, name: 'Sarah Johnson', avatar: 'SJ' },
        { id: 2, name: 'Alex Chen', avatar: 'AC' },
        { id: 3, name: 'Mai Tran', avatar: 'MT' },
        { id: 4, name: 'John Doe', avatar: 'JD' }
    ];

    // Removed commonEmojis - now using comprehensive EmojiPicker

    // Initialize content from props (only on mount or when switching to edit mode)
    useEffect(() => {
        if (mode === 'edit') {
            // For edit mode, always use initial content
            setMessage(initialContent || '');
            setAttachedFiles(initialAttachments || []);
        }
    }, [mode, initialContent, initialAttachments]);

    // Load draft on mount or channel/thread change (except in edit mode)
    useEffect(() => {
        if (mode !== 'edit' && channelId) {
            const draft = getDraft(channelId, threadId);
            if (draft) {
                setMessage(draft.content || '');
                setAttachedFiles(draft.attachments || []);
            } else {
                // Only set initial content if no draft exists and we haven't set content yet
                setMessage(initialContent || '');
                setAttachedFiles(initialAttachments || []);
            }
        }
    }, [channelId, threadId, getDraft, mode]);

    // Track changes for edit mode
    useEffect(() => {
        if (mode === 'edit' && editMessage) {
            setHasChanges(message !== (editMessage.content || '') || 
                         JSON.stringify(attachedFiles) !== JSON.stringify(initialAttachments));
        } else {
            setHasChanges(message.trim() !== '' || attachedFiles.length > 0);
        }
    }, [message, attachedFiles, mode, editMessage, initialAttachments]);

    // Auto-save draft with debouncing (except in edit mode)
    const autoSaveDraft = useCallback(() => {
        if (mode === 'edit') return;
        
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            if (channelId && (message.trim() || attachedFiles.length > 0)) {
                saveDraft(channelId, message, attachedFiles, threadId);
            }
        }, 1000);
    }, [channelId, threadId, message, attachedFiles, saveDraft, mode]);

    // Trigger auto-save when content changes
    useEffect(() => {
        if (mode !== 'edit' && channelId && (message.trim() || attachedFiles.length > 0)) {
            autoSaveDraft();
        }
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [message, attachedFiles, autoSaveDraft, mode, channelId]);

    // Cleanup auto-save timeout on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);

    // Focus editor on mount (only once, not on every disabled change)
    useEffect(() => {
        if (richEditorRef.current && !disabled) {
            // Small delay to ensure the editor is fully rendered
            const timer = setTimeout(() => {
                if (richEditorRef.current) {
                    richEditorRef.current.focus();
                }
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, []); // Only run on mount

    const handleSend = async () => {
        // Basic validations
        if (!message.trim() && attachedFiles.length === 0) {
            setError('Message cannot be empty');
            return;
        }

        if (maxLength && getCharacterCount() > maxLength) {
            setError(`Message is too long (${getCharacterCount()}/${maxLength} characters)`);
            return;
        }

        if (mode === 'edit' && !hasChanges) {
            onCancel?.();
            return;
        }

        if (!onSendMessage) {
            setError('No send handler provided');
            console.error('MessageComposition: onSendMessage prop is required');
            return;
        }

        // Store the current message and files before clearing (for potential restoration)
        const currentMessage = message;
        const currentFiles = attachedFiles;
        const messageData = {
            content: message.trim() || '[File attachment]',
            attachments: attachedFiles
        };

        // Clear form immediately (except in edit mode)
        if (mode !== 'edit') {
            // Clear the rich text editor immediately
            if (richEditorRef.current) {
                richEditorRef.current.clear();
            }
            
            setMessage('');
            setAttachedFiles([]);
            
            // Clear draft since we're sending
            if (channelId) {
                clearDraft(channelId, threadId);
            }
        }

        // Send message without blocking the UI
        setError('');
        
        try {
            setIsSending(true);
            await onSendMessage(messageData);
            
            // Clear the message after successful send
            setMessage('');
            setAttachedFiles([]);
            
            // Clear the draft
            clearDraft();
        } catch (error) {
            console.error('Failed to send message:', error);
            // Don't clear the message on error so user can retry
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else if (e.key === 'Escape' && mode === 'edit') {
            e.preventDefault();
            onCancel?.();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && mode === 'edit') {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileUpload = (e) => {
        try {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            setIsUploading(true);
            setError(''); // Clear any previous errors

            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                setUploadProgress(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    setUploadProgress(0);
                    setAttachedFiles((prev) => [...prev, ...files.map((file) => ({
                        id: Date.now() + Math.random(),
                        name: file.name,
                        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                        type: file.type
                    }))]);
                }
            }, 100);
        } catch (error) {
            console.error('File upload error:', error);
            setError('Failed to upload files');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const removeFile = (fileId) => {
        if (!fileId) {
            console.warn('removeFile called with invalid fileId:', fileId);
            return;
        }
        setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
    };

    const handleMention = (text) => {
        if (!showMentions || typeof text !== 'string') return;
        
        try {
            if (text.includes('@')) {
                const query = text.split('@').pop()?.toLowerCase() || '';
                const suggestions = users.filter((user) =>
                    user?.name?.toLowerCase()?.includes(query)
                );
                setMentionSuggestions(suggestions);
            } else {
                setMentionSuggestions([]);
            }
        } catch (error) {
            console.warn('Error handling mentions:', error);
            setMentionSuggestions([]);
        }
    };

    const insertEmoji = (emoji) => {
        if (richEditorRef.current) {
            richEditorRef.current.insertText(emoji);
        }
        // EmojiPicker handles closing itself
    };

    const handleEmojiPickerClose = () => {
        setShowEmojiPicker(false);
    };

    const getCharacterCount = () => {
        // Get text content without HTML tags for accurate count
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = message || '';
            return tempDiv.textContent?.length || 0;
        } catch (error) {
            console.warn('Error counting characters:', error);
            return message?.length || 0;
        }
    };

    const getPlaceholder = () => {
        if (placeholder) return placeholder;
        
        switch (mode) {
            case 'comment':
                return threadId ? 'Add a comment to this thread...' : 'Add a comment...';
            case 'task':
                return 'Add a comment...';
            case 'edit':
                return 'Edit your message...';
            default:
                return threadId ? 'Reply to thread...' : `Message #${channelId || 'general'}`;
        }
    };

    const currentPlaceholder = getPlaceholder();
    const isDraftSaved = mode !== 'edit' && channelId && hasDraft(channelId, threadId);
    const characterCount = getCharacterCount();
    const isOverLimit = maxLength && characterCount > maxLength;
    const canSend = (message.trim() || attachedFiles.length > 0) && !isLoading && !isOverLimit && !isSending;

    // Determine container styling based on mode and compact setting
    const getContainerClass = () => {
        let baseClass = `${className} bg-white`;
        
        if (mode === 'edit') {
            baseClass += ' border border-gray-200 rounded-lg shadow-sm';
        } else if (compact) {
            baseClass += ' border-t border-gray-200';
        } else {
            baseClass += ' p-4 border-t border-gray-200';
        }
        
        return baseClass;
    };

    const getInputContainerClass = () => {
        let baseClass = 'message-input border border-gray-200 rounded-lg bg-white focus-within:border-indigo-500 focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]';
        
        return baseClass;
    };

    return (
        <div className={getContainerClass()}>
            {/* Edit Mode Header */}
            {mode === 'edit' && (
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            Edit message
                        </span>
                        {maxLength && (
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs ${
                                    isOverLimit ? 'text-red-500' : 'text-gray-500'
                                }`}>
                                    {characterCount}/{maxLength}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Comment Mode Thread Context Header */}
            {mode === 'comment' && showThreadContext && (
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Reply to Thread</h3>
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                                className={`p-1.5 rounded-md transition ${isFollowing ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-100'}`}
                                title={isFollowing ? 'Following thread' : 'Not following thread'}
                            >
                                {isFollowing ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                            </button>

                            {/* Notification Settings Dropdown */}
                            {showNotificationSettings && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <div className="py-1">
                                        <button 
                                            onClick={() => {
                                                setIsFollowing(true);
                                                setShowNotificationSettings(false);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 ${isFollowing ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'}`}
                                        >
                                            <Bell className="h-4 w-4" />
                                            <span>Follow thread</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setIsFollowing(false);
                                                setShowNotificationSettings(false);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 ${!isFollowing ? 'text-gray-700' : 'text-gray-500'}`}
                                        >
                                            <BellOff className="h-4 w-4" />
                                            <span>Unfollow thread</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thread Summary */}
                    {threadSummary && (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>{threadSummary.replies} replies</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Users className="h-4 w-4" />
                                    <span>{threadSummary.participants.length} participants</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <div className="flex -space-x-1">
                                    {threadSummary.participants.map(participant => (
                                        <div 
                                            key={participant.name}
                                            className={`w-5 h-5 rounded-full ${participant.color} flex items-center justify-center text-white text-xs font-medium ring-1 ring-white`}
                                            title={participant.name}
                                        >
                                            {participant.avatar}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-500">Last activity {threadSummary.lastActivity}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Original Message Context for Comments */}
            {mode === 'comment' && originalMessage && (
                <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
                    <div className="text-xs font-medium text-gray-600 mb-2">REPLYING TO</div>
                    <div className="bg-white rounded-lg p-3 border-l-4 border-indigo-500">
                        <div className="flex items-center space-x-2 mb-1">
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                                {originalMessage.author?.avatar || 'U'}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{originalMessage.author?.name || 'Unknown User'}</span>
                            <span className="text-xs text-gray-500">{originalMessage.timestamp}</span>
                        </div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                            {originalMessage.content}
                        </div>
                    </div>
                </div>
            )}

            <div className={getInputContainerClass()}>
                {/* File Attachments */}
                {attachedFiles.length > 0 && (
                    <div className="px-3 py-2 border-b border-gray-200">
                        <div className="space-y-2">
                            {attachedFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center mr-3">
                                            <Paperclip className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500">{file.size}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(file.id)}
                                        className="text-gray-400 hover:text-gray-600"
                                        disabled={disabled}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <div className="px-3 py-2 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <Upload className="h-4 w-4 text-indigo-600" />
                            <div className="flex-1">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Input Area */}
                <div className="relative">
                    <RichTextEditor
                        ref={richEditorRef}
                        value={message}
                        onChange={(content) => {
                            setMessage(content);
                            handleMention(content);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={currentPlaceholder}
                        className="border-0"
                        isDraftSaved={isDraftSaved}
                        disabled={disabled}
                        maxLength={null} // Disable internal character count to avoid duplication
                    />

                    {/* Mention Suggestions */}
                    {showMentions && mentionSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-3 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xs">
                            {mentionSuggestions.map((user) => (
                                <button
                                    key={user.id}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                                    onClick={() => {
                                        setMentionSuggestions([]);
                                    }}
                                >
                                    <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                        {user.avatar}
                                    </div>
                                    <span className="text-sm text-gray-900">{user.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="px-3 py-2 border-t border-red-200 bg-red-50">
                        <div className="flex items-center space-x-2 text-red-700">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Bottom Toolbar */}
                <div className="flex items-center px-3 py-2 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                        {showEmoji && (
                            <div className="relative">
                                <button
                                    ref={emojiButtonRef}
                                    className="toolbar-button p-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                                    title="Emoji"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    disabled={disabled}
                                >
                                    <Smile className="h-4 w-4" />
                                </button>

                                {/* Comprehensive Emoji Picker */}
                                {showEmojiPicker && (
                                    <EmojiPickerWrapper
                                        onEmojiSelect={insertEmoji}
                                        onClose={handleEmojiPickerClose}
                                        triggerRef={emojiButtonRef}
                                    />
                                )}
                            </div>
                        )}

                        {showMentions && (
                            <button 
                                className="toolbar-button p-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200" 
                                title="Mention"
                                disabled={disabled}
                            >
                                <AtSign className="h-4 w-4" />
                            </button>
                        )}
                        
                        {showFileUpload && (
                            <button
                                className="toolbar-button p-1.5 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                                title="Attach File"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled}
                            >
                                <Paperclip className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    
                    <div className="ml-auto flex items-center space-x-2">
                        {/* Edit mode specific buttons */}
                        {mode === 'edit' && onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        )}
                        
                        <button 
                            onClick={handleSend}
                            disabled={!canSend || (mode === 'edit' && !hasChanges)}
                            className={`p-2 rounded-lg transition flex items-center space-x-1 ${
                                canSend && (mode !== 'edit' || hasChanges)
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={mode === 'edit' ? 'Save changes' : 'Send message'}
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : mode === 'edit' ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {mode === 'edit' && !compact && (
                                <span className="text-sm">Save</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Hidden File Input */}
                {showFileUpload && (
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={disabled}
                    />
                )}
            </div>

            {/* Edit History Indicator */}
            {mode === 'edit' && editMessage?.editedAt && (
                <div className="px-3 py-1 border-t border-gray-100 bg-gray-25">
                    <span className="text-xs text-gray-400">
                        Last edited {new Date(editMessage.editedAt.toDate()).toLocaleString()}
                    </span>
                </div>
            )}
        </div>
    );
};

export default MessageComposition;