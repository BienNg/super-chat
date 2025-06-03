import React from 'react';
import { MessageSquare } from 'lucide-react';
import MessageListView from '../MessageListView';
import { MessageComposition } from '../composition';
import { ThreadView } from '../thread';
import ChannelToolbar from '../ChannelToolbar';
import ErrorBoundary from '../ErrorBoundary';
import { useDirectMessages } from '../../../hooks/useDirectMessages';

/**
 * MessagesTab - Messages tab content component
 * Handles message display, composition, and thread management
 */
export const MessagesTab = ({
  channelId,
  messages,
  messagesLoading,
  activeThread,
  onOpenThread,
  onCloseThread,
  onSendMessage,
  onJumpToMessage,
  onOpenTask,
  scrollToMessageId,
  // Message actions
  deleteMessage,
  undoDeleteMessage,
  canDeleteMessage,
  isWithinEditWindow,
  deletingMessages,
  editMessage,
  togglePinMessage,
  getPinnedMessages,
  isMessagePinned,
  // Pagination
  hasMoreMessages,
  loadingMore,
  loadMoreMessages,
  // Channel info
  activeChannel
}) => {
  const { isDMChannel, getOtherParticipant } = useDirectMessages();

  // Get appropriate placeholder text
  const getPlaceholderText = () => {
    if (!activeChannel) return 'Type a message...';
    
    if (isDMChannel(activeChannel)) {
      const otherParticipant = getOtherParticipant(activeChannel);
      if (otherParticipant) {
        const displayName = otherParticipant.displayName || otherParticipant.fullName || otherParticipant.email?.split('@')[0] || 'Unknown User';
        return `Message ${displayName}`;
      }
      return 'Send a direct message...';
    }
    
    return `Message #${activeChannel.name}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Channel Toolbar */}
      <ChannelToolbar 
        channelId={channelId}
        onJumpToMessage={onJumpToMessage}
        onOpenThread={onOpenThread}
        getPinnedMessages={getPinnedMessages}
        togglePinMessage={togglePinMessage}
      />
      
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className={`flex-1 flex flex-col min-h-0 ${activeThread ? 'mr-96' : ''}`}>
          {/* Message List */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Be the first to send a message in this channel!</p>
              </div>
            ) : (
              <ErrorBoundary fallbackMessage="Error loading messages. Please refresh the page.">
                <MessageListView 
                  channelId={channelId}
                  onOpenThread={onOpenThread}
                  scrollToMessageId={scrollToMessageId}
                  messages={messages} 
                  loading={messagesLoading} 
                  sendMessage={onSendMessage}
                  deleteMessage={deleteMessage}
                  undoDeleteMessage={undoDeleteMessage}
                  canDeleteMessage={canDeleteMessage}
                  isWithinEditWindow={isWithinEditWindow}
                  deletingMessages={deletingMessages}
                  editMessage={editMessage}
                  togglePinMessage={togglePinMessage}
                  getPinnedMessages={getPinnedMessages}
                  isMessagePinned={isMessagePinned}
                  hasMoreMessages={hasMoreMessages}
                  loadingMore={loadingMore}
                  loadMoreMessages={loadMoreMessages}
                  onJumpToTask={onOpenTask}
                />
              </ErrorBoundary>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-shrink-0 bg-white">
            <ErrorBoundary fallbackMessage="Error in message composition. Please refresh the page.">
              <MessageComposition 
                onSendMessage={onSendMessage} 
                channelId={channelId}
                placeholder={getPlaceholderText()}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Thread View */}
        {activeThread && (
          <ThreadView
            message={activeThread}
            onClose={onCloseThread}
            channelId={channelId}
            isOpen={true}
          />
        )}
      </div>
    </div>
  );
}; 