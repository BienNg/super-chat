// src/components/MessageListView.jsx (Updated for real-time)
import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    Download,
    FileText,
    Clock,
    Pin,
    Edit3,
    CheckSquare
} from 'lucide-react';
import DOMPurify from 'dompurify';
import ThreadPreview from './thread/ThreadPreview';
import MessageHoverActions from './MessageHoverActions';
import MessageReactions from './MessageReactions';
import ReactionDetailsModal from './ReactionDetailsModal';
import DeleteMessageModal from './DeleteMessageModal';
import UndoDeleteToast from './UndoDeleteToast';
import MessageComposition from './composition/MessageComposition';
import { useTasks } from '../../hooks/useTasks';
import { useMessageReactions } from '../../hooks/useMessageReactions';
const MessageListView = ({ 
    channelId, 
    onOpenThread, 
    scrollToMessageId,
    // Destructure all props from useMessages
    messages,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    undoDeleteMessage,
    canDeleteMessage,
    isWithinEditWindow,
    deletingMessages,
    togglePinMessage,
    getPinnedMessages,
    isMessagePinned,
    hasMoreMessages,
    loadingMore,
    loadMoreMessages,
    onJumpToTask
}) => {
    const [hoveredMessage, setHoveredMessage] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, message: null });
    const [undoToast, setUndoToast] = useState({ isVisible: false, messageId: null, messagePreview: '', deleteType: 'soft' });
    const [editingMessage, setEditingMessage] = useState(null);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [reactionModal, setReactionModal] = useState({ isOpen: false, messageId: null, reactions: [] });
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [isFirstChannelLoad, setIsFirstChannelLoad] = useState(true);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const previousMessageCountRef = useRef(0);
    const previousLatestMessageIdRef = useRef(null);
    const messageRefs = useRef({});
    const previousChannelIdRef = useRef(null);
    const scrollPositionBeforeLoadRef = useRef(null);
    
    // Tasks functionality
    const { createTaskFromMessage } = useTasks(channelId);
    
    // Message reactions functionality
    const { 
        getMessageReactions, 
        addReaction, 
        removeReaction, 
        currentUser 
    } = useMessageReactions(channelId);

    // Function to check if user is scrolled to bottom
    const checkIfScrolledToBottom = () => {
        if (!messagesContainerRef.current) {
            return false;
        }
        
        const container = messagesContainerRef.current;
        const threshold = 20; // More strict threshold - pixels from bottom to consider "at bottom"
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const isAtBottom = distanceFromBottom <= threshold;
        
        return isAtBottom;
    };

    // Handle scroll events to track if user is at bottom
    const handleScroll = () => {
        const isAtBottom = checkIfScrolledToBottom();
        setIsScrolledToBottom(isAtBottom);
    };

    // Custom load more messages handler that preserves scroll position
    const handleLoadMoreMessages = async () => {
        if (!messagesContainerRef.current || loadingMore) return;

        const container = messagesContainerRef.current;
        
        // Set flag to indicate we're loading older messages
        setIsLoadingOlderMessages(true);
        
        // Capture current scroll position and container height
        scrollPositionBeforeLoadRef.current = {
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight
        };

        try {
            // Call the original loadMoreMessages function
            await loadMoreMessages();
        } catch (error) {
            console.error('Error loading more messages:', error);
        } finally {
            // Reset the flag after a short delay to ensure DOM updates are complete
            setTimeout(() => {
                setIsLoadingOlderMessages(false);
            }, 200);
        }
    };

    // Effect to restore scroll position after new messages are loaded
    useEffect(() => {
        if (scrollPositionBeforeLoadRef.current && messagesContainerRef.current && !loadingMore) {
            const container = messagesContainerRef.current;
            const savedPosition = scrollPositionBeforeLoadRef.current;
            
            // Calculate the height difference (new content added above)
            const heightDifference = container.scrollHeight - savedPosition.scrollHeight;
            
            // Restore scroll position by adding the height difference
            const newScrollTop = savedPosition.scrollTop + heightDifference;
            
            // Apply the new scroll position
            container.scrollTop = newScrollTop;
            
            // Clear the saved position
            scrollPositionBeforeLoadRef.current = null;
        }
    }, [messages.length, loadingMore]); // Trigger when messages change and loading is complete

    // Track channel changes to determine first load
    useEffect(() => {
        if (channelId !== previousChannelIdRef.current) {
            setIsFirstChannelLoad(true);
            setIsScrolledToBottom(true); // Reset to bottom for new channel
            setIsLoadingOlderMessages(false); // Reset loading state for new channel
            previousChannelIdRef.current = channelId;
        }
    }, [channelId]);

    // Load pinned messages when channel changes
    useEffect(() => {
        if (channelId && getPinnedMessages) {
            getPinnedMessages().then(setPinnedMessages).catch(console.error);
        }
    }, [channelId, getPinnedMessages]);

    // Update pinned messages when messages change (in case of real-time updates)
    useEffect(() => {
        if (channelId && getPinnedMessages) {
            getPinnedMessages().then(setPinnedMessages).catch(console.error);
        }
    }, [messages, channelId, getPinnedMessages]);

    // Check scroll position when messages first load
    useEffect(() => {
        if (messages.length > 0 && !loading && messagesContainerRef.current) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                const isAtBottom = checkIfScrolledToBottom();
                setIsScrolledToBottom(isAtBottom);
            }, 100);
        }
    }, [messages.length, loading]);

    // Auto-scroll to bottom when new messages are added or on first channel load
    useEffect(() => {
        // Skip auto-scroll if we're currently loading older messages
        if (isLoadingOlderMessages) {
            return;
        }

        const currentMessageCount = messages.length;
        
        // Get the latest message ID to detect actual new messages
        const latestMessageId = messages.length > 0 ? messages[messages.length - 1]?.id : null;
        
        // Immediate scroll to bottom on first channel load (no animation for faster UX)
        if (isFirstChannelLoad && currentMessageCount > 0 && !loading) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            setIsFirstChannelLoad(false);
            setIsScrolledToBottom(true);
            previousLatestMessageIdRef.current = latestMessageId;
        }
        // Auto-scroll when new messages are added - check both count AND latest message ID
        // Only trigger if the latest message ID has changed (indicating a new message at the end)
        else if (
            latestMessageId && 
            latestMessageId !== previousLatestMessageIdRef.current && 
            currentMessageCount > 0 && 
            !isFirstChannelLoad &&
            !loading
        ) {
            // Small delay to ensure DOM is updated with new message
            setTimeout(() => {
                // Check current scroll position in real-time (don't rely only on stored state)
                const currentlyAtBottom = checkIfScrolledToBottom();
                
                // Check if the newest message is from the current user
                const newestMessage = messages[messages.length - 1];
                const isOwnMessage = newestMessage && currentUser && 
                    (newestMessage.author?.id === currentUser.id || 
                     newestMessage.author?.email === currentUser.email);
                
                // Scroll to bottom if user was already at bottom OR if it's their own message
                // Use real-time check as primary, stored state as fallback
                if (currentlyAtBottom || isScrolledToBottom || isOwnMessage) {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setIsScrolledToBottom(true);
                }
            }, 100); // Small delay to ensure message is in DOM
        }
        
        // Update the refs with current values
        previousMessageCountRef.current = currentMessageCount;
        previousLatestMessageIdRef.current = latestMessageId;
    }, [messages, loading, isFirstChannelLoad, isScrolledToBottom, currentUser, isLoadingOlderMessages]);

    // Scroll to specific message when scrollToMessageId changes
    useEffect(() => {
        if (scrollToMessageId && messageRefs.current[scrollToMessageId]) {
            // Scroll to the message
            messageRefs.current[scrollToMessageId].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Update scroll position state after scrolling to specific message
            setTimeout(() => {
                const isAtBottom = checkIfScrolledToBottom();
                setIsScrolledToBottom(isAtBottom);
            }, 500); // Wait for scroll animation to complete
            
            // Highlight the message temporarily
            setHighlightedMessageId(scrollToMessageId);
            
            // Remove highlight after 3 seconds
            const timer = setTimeout(() => {
                setHighlightedMessageId(null);
            }, 3000);
            
            return () => clearTimeout(timer);
        } else if (scrollToMessageId) {
            // Message not found in current view - could be an older message not loaded
        }
    }, [scrollToMessageId, messages]); // Added messages dependency to retry when messages update

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
                   ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    };

    const handleThreadClick = (messageId) => {
        onOpenThread?.(messageId);
    };

    const handleViewReactionDetails = (messageId, emoji, users) => {
        const reactions = getMessageReactions(messageId);
        setReactionModal({
            isOpen: true,
            messageId,
            reactions
        });
    };

    const closeReactionModal = () => {
        setReactionModal({ isOpen: false, messageId: null, reactions: [] });
    };

    const handleShareMessage = (messageId) => {
        // TODO: Implement share functionality
    };

    const handleBookmarkMessage = (messageId) => {
        // TODO: Implement bookmark functionality
    };

    const handleEditMessage = (messageId) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        // Check if user can edit this message
        if (!isWithinEditWindow(message)) {
            return;
        }

        setEditingMessage(message);
    };

    const handleEditSave = async (messageData) => {
        if (!editingMessage) return;

        try {
            await editMessage(editingMessage.id, messageData.content);
            setEditingMessage(null);
        } catch (error) {
            throw error; // Let the editor component handle the error
        }
    };

    const handleEditCancel = () => {
        setEditingMessage(null);
    };

    const handleDeleteMessage = async (messageId) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        // Check if user can delete this message
        const hasPermission = await canDeleteMessage(message);
        if (!hasPermission) {
            return;
        }

        // Show delete confirmation modal
        setDeleteModal({
            isOpen: true,
            message: message
        });
    };

    const handleDeleteConfirm = async (options) => {
        const { message } = deleteModal;
        if (!message) return;

        try {
            const result = await deleteMessage(message.id, options);
            
            // Close modal
            setDeleteModal({ isOpen: false, message: null });
            
            if (result.success && result.canUndo) {
                // Show undo toast for soft deletes
                setUndoToast({
                    isVisible: true,
                    messageId: result.messageId,
                    messagePreview: message.content || '',
                    deleteType: result.deleteType
                });
            }
        } catch (error) {
            // Keep modal open to show error
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, message: null });
    };

    const handleUndoDelete = async () => {
        try {
            await undoDeleteMessage(undoToast.messageId);
        } catch (error) {
            throw error; // Let the toast component handle the error
        }
    };

    const handleUndoDismiss = () => {
        setUndoToast({ isVisible: false, messageId: null, messagePreview: '', deleteType: 'soft' });
    };

    const handlePinMessage = async (messageId) => {
        try {
            const result = await togglePinMessage(messageId);
            if (result.success) {
                // Update local pinned messages state
                if (result.isPinned) {
                    const message = messages.find(m => m.id === messageId);
                    if (message) {
                        setPinnedMessages(prev => [...prev, message]);
                    }
                } else {
                    setPinnedMessages(prev => prev.filter(m => m.id !== messageId));
                }
            }
        } catch (error) {
        }
    };

    const handleReportMessage = (messageId) => {
        // TODO: Implement report functionality
    };

    const handlePushToTasks = async (messageId) => {
        try {
            const message = messages.find(m => m.id === messageId);
            if (!message) {
                return;
            }

            // Check if message is already a task
            if (message.isTask) {
                return;
            }

            await createTaskFromMessage(messageId, message);
        } catch (error) {
        }
    };

    const handleJumpToTask = (taskId) => {
        if (onJumpToTask && taskId) {
            onJumpToTask(taskId);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4" ref={messagesContainerRef} onScroll={handleScroll}>
                {/* Load More Messages Button */}
                {hasMoreMessages && (
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={handleLoadMoreMessages}
                            disabled={loadingMore}
                            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loadingMore ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                                    Loading...
                                </div>
                            ) : (
                                'Load More Messages'
                            )}
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <MessageSquare className="h-12 w-12 mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm">Be the first to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        // Handle deleted messages
                        if (message.deleted) {
                            return (
                                <div
                                    key={message.id}
                                    className="message-container relative group rounded-lg p-2 -m-2 opacity-60"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-400 flex-shrink-0 flex items-center justify-center text-white font-medium">
                                            {message.author?.displayName?.charAt(0) || 
                                             message.author?.email?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-500 truncate">
                                                    {message.author?.displayName || message.author?.email || 'Unknown User'}
                                                </span>
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                    {formatTimestamp(message.createdAt)}
                                                </span>
                                            </div>
                                            <div className="text-gray-500 italic text-sm text-left">
                                                [Message deleted]
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Check if this message is being edited
                        if (editingMessage && editingMessage.id === message.id) {
                            return (
                                <div key={message.id} className="message-container p-2 -m-2">
                                    <MessageComposition
                                        mode="edit"
                                        initialContent={editingMessage.content}
                                        initialAttachments={editingMessage.attachments || []}
                                        onSendMessage={handleEditSave}
                                        onCancel={handleEditCancel}
                                        isLoading={false}
                                        editMessage={editingMessage}
                                        maxLength={4000}
                                        compact={true}
                                    />
                                </div>
                            );
                        }

                        const isPinned = pinnedMessages.some(pm => pm.id === message.id);

                        return (
                            <div
                                key={message.id}
                                ref={el => messageRefs.current[message.id] = el}
                                className={`message-container relative group hover:bg-gray-50 rounded-lg p-2 -m-2 transition-all duration-300 ${
                                    deletingMessages?.has(message.id) ? 'opacity-50 pointer-events-none' : ''
                                } ${isPinned ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''} ${
                                    message.isTask ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                                } ${highlightedMessageId === message.id ? 'bg-indigo-50 border-2 border-indigo-500 shadow-md ring-2 ring-indigo-200' : ''}`}
                                onMouseEnter={() => setHoveredMessage(message.id)}
                                onMouseLeave={() => setHoveredMessage(null)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white font-medium">
                                        {message.author?.displayName?.charAt(0) || 
                                         message.author?.email?.charAt(0) || 'U'}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900 truncate">
                                                {message.author?.displayName || message.author?.email || 'Unknown User'}
                                            </span>
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                {formatTimestamp(message.createdAt)}
                                            </span>
                                            {!message.createdAt && (
                                                <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                            )}
                                            {isPinned && (
                                                <Pin className="h-3 w-3 text-yellow-600 flex-shrink-0" title="Pinned message" />
                                            )}
                                            {message.isTask && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleJumpToTask(message.taskId);
                                                    }}
                                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                                                >
                                                    <CheckSquare className="w-3 h-3 mr-1" />
                                                    View Task
                                                </button>
                                            )}
                                            {message.editedAt && (
                                                <span className="text-xs text-gray-400 flex-shrink-0" title={`Edited ${new Date(message.editedAt.toDate()).toLocaleString()}`}>
                                                    (edited)
                                                </span>
                                            )}
                                        </div>

                                        <div className="message-content text-gray-800 text-left break-words whitespace-pre-wrap overflow-wrap-anywhere max-w-full">
                                            {message.content?.includes('<') && message.content?.includes('>') ? (
                                                <div dangerouslySetInnerHTML={{ 
                                                    __html: DOMPurify.sanitize(message.content, {
                                                        ALLOWED_TAGS: [
                                                            'p', 'br', 'strong', 'em', 'u', 'strike', 'ul', 'ol', 'li', 
                                                            'blockquote', 'pre', 'code', 'a', 'div', 'span', 'h1', 'h2', 
                                                            'h3', 'h4', 'h5', 'h6', 'style'
                                                        ],
                                                        ALLOWED_ATTR: [
                                                            'href', 'target', 'rel', 'style', 'class', 'title'
                                                        ],
                                                        ALLOW_DATA_ATTR: false
                                                    })
                                                }} />
                                            ) : (
                                                message.content
                                            )}
                                        </div>

                                    {/* File Attachments */}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            {message.attachments.map((attachment, idx) => (
                                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center max-w-sm">
                                                    <FileText className="h-6 w-6 text-indigo-500 mr-3 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{attachment.name}</p>
                                                        <p className="text-xs text-gray-500">{attachment.type} • {attachment.size}</p>
                                                    </div>
                                                    <button className="ml-3 text-indigo-600 hover:text-indigo-700 flex-shrink-0">
                                                        <Download className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Message Reactions */}
                                    <MessageReactions
                                        messageId={message.id}
                                        reactions={getMessageReactions(message.id)}
                                        currentUserId={currentUser?.id}
                                        onAddReaction={addReaction}
                                        onRemoveReaction={removeReaction}
                                        onViewReactionDetails={handleViewReactionDetails}
                                    />

                                                                        {/* Thread Preview */}
                                    <ThreadPreview 
                                        message={message}
                                        channelId={channelId}
                                        onOpenThread={handleThreadClick}
                                    />
                                </div>
                            </div>

                            {/* Slack-style Hover Actions */}
                            {hoveredMessage === message.id && !deletingMessages?.has(message.id) && (
                                <MessageHoverActions
                                    messageId={message.id}
                                    messageContent={message.content}
                                    channelId={channelId}
                                    onReplyInThread={handleThreadClick}
                                    onShareMessage={handleShareMessage}
                                    onBookmarkMessage={handleBookmarkMessage}
                                    onEditMessage={handleEditMessage}
                                    onDeleteMessage={handleDeleteMessage}
                                    onPinMessage={handlePinMessage}
                                    onReportMessage={handleReportMessage}
                                    onPushToTasks={handlePushToTasks}
                                    onViewTask={handleJumpToTask}
                                    isTask={message.isTask}
                                    taskId={message.taskId}
                                />
                            )}
                        </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteMessageModal
                message={deleteModal.message}
                isOpen={deleteModal.isOpen}
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                canHardDelete={true} // TODO: Check user permissions
                hasReplies={false} // OPTIMIZATION: Simplified - let users choose deletion type
                isPinned={false} // TODO: Check if message is pinned
                isWithinEditWindow={deleteModal.message ? isWithinEditWindow(deleteModal.message) : true}
            />

            {/* Undo Delete Toast */}
            <UndoDeleteToast
                isVisible={undoToast.isVisible}
                onUndo={handleUndoDelete}
                onDismiss={handleUndoDismiss}
                messagePreview={undoToast.messagePreview}
                deleteType={undoToast.deleteType}
            />

            {/* Reaction Details Modal */}
            <ReactionDetailsModal
                isOpen={reactionModal.isOpen}
                onClose={closeReactionModal}
                messageId={reactionModal.messageId}
                reactions={reactionModal.reactions}
            />
        </div>
    );
};

export default MessageListView;