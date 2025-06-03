import React from 'react';
import MessageComposition from '../composition/MessageComposition';

const TaskComposer = ({ onSendMessage, placeholder = "Add a comment...", isLoading = false, channelId, threadId }) => {
    return (
        <div className="p-4">
            <MessageComposition
                onSendMessage={onSendMessage}
                channelId={channelId}
                threadId={threadId}
                placeholder={placeholder}
                mode="task"
                isLoading={isLoading}
                compact={true}
                showFileUpload={true}
                showEmoji={true}
                showMentions={true}
            />
        </div>
    );
};

export default TaskComposer; 