// src/components/ThreadView.jsx
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, MessageSquare, X } from 'lucide-react';
import { useThreadReplies } from '../../../hooks/useThreadReplies';
import MessageComposition from '../composition/MessageComposition';
import MessageReactions from '../MessageReactions';
import ReactionDetailsModal from '../ReactionDetailsModal';
import { useMessageReactions } from '../../../hooks/useMessageReactions';
import DOMPurify from 'dompurify';

const ThreadView = ({ message, isOpen, onClose, channelId }) => {
    const { threadReplies, repliesLoading, sendReply } = useThreadReplies(channelId, message?.id);
    const [replyContent, setReplyContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [reactionModal, setReactionModal] = useState({ isOpen: false, messageId: null, reactions: [] });
    
    // Message reactions functionality
    const { 
        getMessageReactions, 
        addReaction, 
        removeReaction, 
        currentUser 
    } = useMessageReactions(channelId);

    const handleSendReply = async (messageData) => {
        if (messageData.content.trim()) {
            try {
                await sendReply(messageData.content);
                
                // Clear draft after sending is handled by MessageComposition
            } catch (error) {
                console.error('Failed to send reply:', error);
            }
        }
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

    // Extract participants from message and replies
    const getThreadParticipants = () => {
        const participantMap = new Map();
        
        // Add original message author
        if (message.author) {
            participantMap.set(message.author.id || message.author.email, message.author);
        }
        
        // Add reply participants
        threadReplies.forEach(reply => {
            participantMap.set(reply.id || reply.email, reply);
        });
        
        return Array.from(participantMap.values());
    };

    const participants = getThreadParticipants();

    if (!isOpen || !message) return null;

    // Get author initials for avatar
    const getAuthorInitials = (author) => {
        if (!author) return 'U';
        return author.displayName?.charAt(0) || author.email?.charAt(0) || 'U';
    };

    // Get a consistent color based on user email or name
    const getAuthorColor = (author) => {
        if (!author) return 'bg-gray-400';
        const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500'];
        const str = author.displayName || author.email || '';
        const index = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    // Format timestamp helper
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown time';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Combine original message with replies for unified display
    const allMessages = [
        {
            ...message,
            id: message.id || 'original',
            timestamp: formatTimestamp(message.createdAt || message.timestamp)
        },
        ...threadReplies.map(reply => ({
            ...reply,
            timestamp: formatTimestamp(reply.createdAt)
        }))
    ];

    return (
        <div 
            className={`fixed right-0 top-0 w-96 bg-white border-l border-gray-200 flex flex-col h-screen z-40 min-h-0
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            {/* Thread Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-200 rounded-md transition"
                        >
                            <ArrowLeft className="h-4 w-4 text-gray-600" />
                        </button>
                        <h3 className="font-semibold text-gray-900">Thread</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 rounded-md transition"
                    >
                        <X className="h-4 w-4 text-gray-600" />
                    </button>
                </div>

                {/* Thread Participants */}
                <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div className="flex -space-x-1">
                        {participants.slice(0, 5).map((participant, index) => (
                            <div
                                key={participant.id || participant.email || index}
                                className={`w-6 h-6 rounded-full ${getAuthorColor(participant)} flex items-center justify-center text-white text-xs font-medium ring-2 ring-white`}
                                title={participant.displayName || participant.email}
                            >
                                {getAuthorInitials(participant)}
                            </div>
                        ))}
                        {participants.length > 5 && (
                            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium ring-2 ring-white">
                                +{participants.length - 5}
                            </div>
                        )}
                    </div>
                    <span className="text-sm text-gray-500">
                        {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
                    </span>
                </div>
            </div>

            {/* All Messages (Original + Replies) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
                {allMessages.map((msg, index) => (
                    <div key={msg.id || index} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full ${getAuthorColor(msg.author)} flex-shrink-0 flex items-center justify-center text-white font-medium`}>
                            {getAuthorInitials(msg.author)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900">
                                    {msg.author?.displayName || msg.author?.email || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {msg.timestamp}
                                </span>
                            </div>
                            <div className="text-sm text-gray-700 leading-relaxed text-left break-words whitespace-pre-wrap overflow-wrap-anywhere">
                                {msg.content?.includes('<') && msg.content?.includes('>') ? (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(msg.content, {
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
                                        }}
                                    />
                                ) : (
                                    msg.content
                                )}
                            </div>

                            {/* Message Reactions */}
                            <MessageReactions
                                messageId={msg.id}
                                reactions={getMessageReactions(msg.id)}
                                currentUserId={currentUser?.id}
                                onAddReaction={addReaction}
                                onRemoveReaction={removeReaction}
                                onViewReactionDetails={handleViewReactionDetails}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Thread Reply Input */}
            <div className="flex-shrink-0 p-4">
                <MessageComposition
                    onSendMessage={handleSendReply}
                    channelId={channelId}
                    threadId={message?.id}
                    placeholder="Reply to thread..."
                    mode="comment"
                    compact={true}
                    showFileUpload={true}
                    showEmoji={true}
                    showMentions={true}
                />
            </div>

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

export default ThreadView;