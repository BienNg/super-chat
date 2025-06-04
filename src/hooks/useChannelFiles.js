import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client
import { useAuth } from '../contexts/AuthContext';

// Helper to convert potential Supabase timestamp strings to Date objects
const toDateSafe = (timestamp) => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  const parsedDate = new Date(timestamp);
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

export const useChannelFiles = (channelId) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { currentUser, userProfile } = useAuth(); // Assuming Supabase user

    const fetchChannelFiles = useCallback(async () => {
        if (!channelId || !currentUser?.id) {
            setFiles([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Query messages in the channel that have attachments
            const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('id, attachments, created_at, user_id, profiles ( id, display_name ) ') // Assuming author info is in a related 'profiles' table
                .eq('channel_id', channelId)
                .not('attachments', 'is', null) // Check that attachments is not null
                .order('created_at', { ascending: false })
                .limit(200);

            if (messagesError) throw messagesError;

            const allFiles = [];
            if (messages) {
                messages.forEach((message) => {
                    if (message.attachments && Array.isArray(message.attachments)) {
                        message.attachments.forEach((attachment, index) => {
                            allFiles.push({
                                id: `${message.id}_file_${index}`, // Unique ID for each file derived from message and index
                                messageId: message.id,
                                ...attachment, // Assuming attachment object has name, type, url (or path for Supabase storage)
                                uploadedAt: toDateSafe(message.created_at),
                                uploadedBy: message.profiles ? { id: message.user_id, displayName: message.profiles.display_name } : { id: message.user_id, displayName: 'Unknown User' },
                                channelId: channelId,
                                // Supabase specific: storage_path might be stored in attachment e.g. attachment.storagePath
                                storagePath: attachment.storagePath || null 
                            });
                        });
                    }
                });
            }
            
            setFiles(allFiles);
        } catch (err) {
            console.error('Error fetching channel files:', err);
            setError(err.message);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [channelId, currentUser?.id]);

    useEffect(() => {
        fetchChannelFiles();

        if (!channelId || !currentUser?.id) return;

        // Real-time listener for new messages or changes to messages in the current channel
        const messageSubscription = supabase
            .channel(`public:messages:channel_id=eq.${channelId}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, 
                (payload) => {
                    // console.log('Message change received, refetching files:', payload);
                    // Check if attachments were affected, or just refetch all for simplicity
                    fetchChannelFiles();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(messageSubscription);
        };
    }, [fetchChannelFiles, channelId, currentUser?.id]);

    const getChannelFiles = useCallback(async () => {
        return files;
    }, [files]);

    const searchFiles = useCallback((searchQuery) => {
        if (!searchQuery) return files;
        const query = searchQuery.toLowerCase();
        return files.filter(file => 
            file.name?.toLowerCase().includes(query) ||
            file.type?.toLowerCase().includes(query) ||
            file.uploadedBy?.displayName?.toLowerCase().includes(query)
        );
    }, [files]);

    const getFilesByType = useCallback((fileType) => {
        if (!fileType || fileType === 'all') return files;
        return files.filter(file => {
            const type = file.type?.toLowerCase() || '';
            switch (fileType.toLowerCase()) {
                case 'image': return type.startsWith('image/');
                case 'video': return type.startsWith('video/');
                case 'audio': return type.startsWith('audio/');
                case 'document':
                    return type.includes('pdf') || type.includes('document') || type.includes('text') ||
                           type.includes('msword') || type.includes('wordprocessingml') || 
                           type.includes('spreadsheet') || type.includes('presentationml');
                case 'archive':
                    return type.includes('zip') || type.includes('rar') || type.includes('tar') ||
                           type.includes('gzip') || type.includes('7z');
                default: return type.includes(fileType.toLowerCase());
            }
        });
    }, [files]);

    const downloadFile = async (fileId) => {
        try {
            const file = files.find(f => f.id === fileId);
            if (!file) throw new Error('File not found');

            let downloadURL = file.url; // If a direct URL is already in the attachment

            if (!downloadURL && file.storagePath) { // If using Supabase storage path
                // Assumes a bucket named 'channel_files' or similar; adjust as needed.
                const { data, error } = await supabase.storage
                    .from('channel_files') // Replace 'channel_files' with your actual bucket name
                    .createSignedUrl(file.storagePath, 60 * 5); // Signed URL valid for 5 minutes
                
                if (error) throw error;
                downloadURL = data.signedUrl;
            }

            if (!downloadURL) throw new Error('File URL or storage path not available');

            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = file.name || 'download';
            link.target = '_blank'; // Open in new tab, useful for PDFs or if direct download fails
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return { success: true, fileId };
        } catch (error) {
            console.error('Error downloading file:', error);
            setError('Failed to download file: ' + error.message);
            throw error;
        }
    };

    const canDeleteFile = useCallback(async (fileId) => {
        if (!currentUser?.id || !fileId) return false;
        try {
            const file = files.find(f => f.id === fileId);
            if (!file) return false;

            if (file.uploadedBy?.id === currentUser.id) return true;

            // Check channel ownership or admin role (simplified)
            // This assumes your 'channels' table has an 'owner_id' or similar, 
            // or you have a separate table for channel admins/moderators.
            const { data: channelData, error: channelError } = await supabase
                .from('channels')
                .select('owner_id') // Or other relevant admin/moderator fields
                .eq('id', channelId)
                .single();

            if (channelError) {
                console.error('Error fetching channel data for permissions:', channelError);
                // Fallback: don't allow deletion if channel info is unavailable
                return userProfile?.role === 'admin'; 
            }
            
            // Example: if channel has owner_id and current user is owner
            if (channelData && channelData.owner_id === currentUser.id) return true;
            // TODO: Add more sophisticated role/permission checks based on your schema
            // (e.g., checking a channel_memberships table with roles)

            return userProfile?.role === 'admin'; // System admin can delete
        } catch (error) {
            console.error('Error checking file deletion permissions:', error);
            return false;
        }
    }, [files, currentUser, userProfile, channelId]);

    const deleteFile = async (fileId) => {
        if (!fileId || !currentUser?.id) {
            throw new Error('Missing required parameters for file deletion');
        }

        try {
            setError(null);
            const file = files.find(f => f.id === fileId);
            if (!file) throw new Error('File not found');

            const hasPermission = await canDeleteFile(fileId);
            if (!hasPermission) {
                throw new Error('You do not have permission to delete this file');
            }

            // 1. Delete from Supabase Storage (if storagePath exists)
            if (file.storagePath) {
                try {
                    // Replace 'channel_files' with your actual bucket name
                    const { error: storageError } = await supabase.storage
                        .from('channel_files') 
                        .remove([file.storagePath]);
                    if (storageError) {
                        console.warn('Error deleting file from Supabase storage:', storageError);
                        // Decide if you want to throw or continue to remove from message
                    }
                } catch (storageError) {
                    console.warn('Exception during file deletion from storage:', storageError);
                }
            }

            // 2. Remove attachment from the message in Supabase DB
            const { data: message, error: fetchMessageError } = await supabase
                .from('messages')
                .select('attachments')
                .eq('id', file.messageId)
                .single();

            if (fetchMessageError) throw fetchMessageError;
            if (!message) throw new Error('Original message not found to remove attachment');

            const updatedAttachments = (message.attachments || []).filter(
                att => !(att.name === file.name && att.storagePath === file.storagePath) // Example: identify by name and path
                // Or, if attachments have unique IDs: att.id !== file.attachment_id (if `file` has `attachment_id`)
            );

            const { error: updateMessageError } = await supabase
                .from('messages')
                .update({ 
                    attachments: updatedAttachments,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', file.messageId);

            if (updateMessageError) throw updateMessageError;
            
            // Refetch files as the source (messages) has changed
            // The real-time listener should ideally handle this, but a manual call ensures consistency.
            // await fetchChannelFiles(); // Or rely on real-time update

            return { success: true, fileId };
        } catch (err) {
            console.error('Error deleting file record:', err);
            setError('Failed to delete file: ' + err.message);
            throw err;
        }
    };

    return {
        files,
        loading,
        error,
        getChannelFiles,
        searchFiles,
        getFilesByType,
        downloadFile,
        canDeleteFile,
        deleteFile,
        refetchChannelFiles: fetchChannelFiles // Expose refetch if needed
    };
}; 