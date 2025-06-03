import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { AppLayout } from '../layout';
import { CreateChannel } from '../channel';

/**
 * EmptyState - Component shown when user has no channels
 * Provides guidance and call-to-action for creating first channel
 */
export const EmptyState = ({ 
  userProfile, 
  currentUser, 
  onLogout,
  showCreateChannel,
  onShowCreateChannel,
  onHideCreateChannel,
  onChannelCreated
}) => {
  return (
    <>
      <AppLayout
        channels={[]}
        userProfile={userProfile}
        currentUser={currentUser}
        onLogout={onLogout}
        onCreateChannel={onShowCreateChannel}
      >
        {/* Empty State Content */}
        <div className="flex items-center justify-center bg-gray-50 h-full">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No Channel Selected</h2>
            <p className="text-gray-500">Create a channel to start messaging with your team.</p>
          </div>
        </div>
      </AppLayout>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <CreateChannel
          isOpen={showCreateChannel}
          onClose={onHideCreateChannel}
          onChannelCreated={onChannelCreated}
        />
      )}
    </>
  );
}; 