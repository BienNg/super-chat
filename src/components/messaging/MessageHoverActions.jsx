import React, { useState, useEffect, useRef } from 'react';
import {
    Smile,
    MoreHorizontal,
    Reply,
    Share,
    Bookmark,
    Copy,
    Edit3,
    Trash2,
    Pin,
    AlertTriangle,
    CheckSquare
} from 'lucide-react';
import EmojiPickerWrapper from './composition/EmojiPickerWrapper';
import { useMessageReactions } from '../../hooks/useMessageReactions';
import './MessageHoverActions.css';

const MessageHoverActions = ({ 
    messageId, 
    messageContent,
    channelId,
    onReplyInThread,
    onShareMessage,
    onBookmarkMessage,
    onEditMessage,
    onDeleteMessage,
    onPinMessage,
    onReportMessage,
    onPushToTasks,
    onViewTask,
    isTask = false,
    taskId = null,
    className = ""
}) => {
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showMoreActions, setShowMoreActions] = useState(false);
    const { addReaction, hasUserReacted } = useMessageReactions(channelId);
    const reactionButtonRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.reaction-picker') && !event.target.closest('.more-actions-menu')) {
                setShowReactionPicker(false);
                setShowMoreActions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddReaction = async (emoji) => {
        try {
            await addReaction(messageId, emoji);
            setShowReactionPicker(false);
        } catch (error) {
            console.error('Error adding reaction:', error);
            setShowReactionPicker(false);
        }
    };

    const handleQuickReaction = async (emoji) => {
        try {
            await addReaction(messageId, emoji);
        } catch (error) {
            console.error('Error adding quick reaction:', error);
        }
    };

    const handleReactionPickerClose = () => {
        setShowReactionPicker(false);
    };

    const handleCopyMessage = () => {
        navigator.clipboard.writeText(messageContent);
        // TODO: Show toast notification
    };

    // Quick reaction emojis for hover (most common ones)
    const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

    return (
        <div className={`message-hover-actions ${className}`}>
            {/* Add Reaction */}
            <div className="relative">
                <button
                    ref={reactionButtonRef}
                    title="Add reaction"
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                >
                    <Smile className="h-4 w-4" />
                </button>
                
                {/* Quick Reactions + Full Picker */}
                {showReactionPicker && (
                    <>
                        {/* Quick reactions for fast access */}
                        <div className="reaction-picker">
                            <div className="quick-reactions">
                                {quickReactions.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleQuickReaction(emoji)}
                                        title={`React with ${emoji}`}
                                        className={`quick-reaction-btn ${
                                            hasUserReacted(messageId, emoji) ? 'active' : ''
                                        }`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Full emoji picker as portal */}
                        <EmojiPickerWrapper
                            onEmojiSelect={handleAddReaction}
                            onClose={handleReactionPickerClose}
                            triggerRef={reactionButtonRef}
                            className="reaction-emoji-picker"
                        />
                    </>
                )}
            </div>

            {/* Reply in Thread */}
            <button
                title="Reply in thread"
                onClick={() => onReplyInThread?.(messageId)}
            >
                <Reply className="h-4 w-4" />
            </button>

            {/* Share */}
            <button
                title="Share message"
                onClick={() => onShareMessage?.(messageId)}
            >
                <Share className="h-4 w-4" />
            </button>

            {/* Push to Tasks / View Task */}
            {!isTask ? (
                <button
                    title="Push to Tasks"
                    onClick={() => onPushToTasks?.(messageId)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                >
                    <CheckSquare className="h-4 w-4" />
                </button>
            ) : (
                <button
                    title="View Task"
                    onClick={() => onViewTask?.(taskId)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                >
                    <CheckSquare className="h-4 w-4" />
                </button>
            )}

            {/* More Actions */}
            <div className="relative">
                <button
                    title="More actions"
                    onClick={() => setShowMoreActions(!showMoreActions)}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </button>

                {/* More Actions Menu */}
                {showMoreActions && (
                    <div className="more-actions-menu">
                        <button
                            onClick={() => {
                                onBookmarkMessage?.(messageId);
                                setShowMoreActions(false);
                            }}
                        >
                            <Bookmark className="h-4 w-4" />
                            Save for later
                        </button>
                        <button
                            onClick={handleCopyMessage}
                        >
                            <Copy className="h-4 w-4" />
                            Copy text
                        </button>
                        <button
                            onClick={() => {
                                onPinMessage?.(messageId);
                                setShowMoreActions(false);
                            }}
                        >
                            <Pin className="h-4 w-4" />
                            Pin to channel
                        </button>
                        <div className="divider"></div>
                        <button
                            onClick={() => {
                                onEditMessage?.(messageId);
                                setShowMoreActions(false);
                            }}
                        >
                            <Edit3 className="h-4 w-4" />
                            Edit message
                        </button>
                        <button
                            className="danger"
                            onClick={() => {
                                onDeleteMessage?.(messageId);
                                setShowMoreActions(false);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete message
                        </button>
                        <div className="divider"></div>
                        <button
                            onClick={() => {
                                onReportMessage?.(messageId);
                                setShowMoreActions(false);
                            }}
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Report message
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageHoverActions; 