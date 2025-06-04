// src/hooks/useMessages.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Helper to convert Supabase timestamp to Date object
const toDateSafe = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
};

export const useMessages = (channelId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [oldestMessageTimestamp, setOldestMessageTimestamp] = useState(null); // For pagination

    const MESSAGES_PER_PAGE = 20; // Define how many messages to load per page
    
    const { currentUser, userProfile } = useAuth();

    const fetchMessages = useCallback(async (isInitialLoad = false) => {
        if (!channelId || !currentUser?.id) {
            setMessages([]);
            setLoading(false);
            setHasMoreMessages(true);
            setOldestMessageTimestamp(null);
            return;
        }

        if (isInitialLoad) {
        setLoading(true);
            setMessages([]); // Clear messages on initial load for a new channel
            setOldestMessageTimestamp(null); // Reset pagination cursor
        setHasMoreMessages(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            let query = supabase
                .from('messages')
                .select('*, author:profiles (*)') // Assuming 'profiles' table via user_id -> author_id
                .eq('channel_id', channelId)
                .order('created_at', { ascending: false }) // Fetch newest first
                .limit(MESSAGES_PER_PAGE);

            if (!isInitialLoad && oldestMessageTimestamp) {
                query = query.lt('created_at', oldestMessageTimestamp); // Fetch messages older than the current oldest
            }
            
            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            const fetchedMessages = (data || []).map(msg => ({
                ...msg,
                createdAt: toDateSafe(msg.created_at),
                updatedAt: toDateSafe(msg.updated_at),
                // Adapt author structure if different
                author: msg.author ? { 
                    id: msg.user_id, // or msg.author.id
                    displayName: msg.author.display_name || msg.author.username, // Adjust to your profiles table
                    avatar: msg.author.avatar_url 
                } : { id: msg.user_id, displayName: 'Unknown User'}
            })).reverse(); // Reverse to display oldest first in the array

            if (fetchedMessages.length < MESSAGES_PER_PAGE) {
                setHasMoreMessages(false);
            }

            if (fetchedMessages.length > 0) {
                 // For pagination: store the timestamp of the oldest message fetched in this batch (which is the first after reverse)
                // but since we fetched newest first, it's data[data.length-1].created_at before reverse
                const oldestInBatchTimestamp = data[data.length-1].created_at;
                if (isInitialLoad || new Date(oldestInBatchTimestamp) < new Date(oldestMessageTimestamp || '9999-12-31')) {
                    setOldestMessageTimestamp(oldestInBatchTimestamp);
                }
            }


            setMessages(prevMessages => {
                if (isInitialLoad) return fetchedMessages;
                // Prevent duplicates when loading more
                const existingIds = new Set(prevMessages.map(m => m.id));
                const newMessages = fetchedMessages.filter(m => !existingIds.has(m.id));
                return [...newMessages, ...prevMessages]; // Prepend older messages
            });

        } catch (err) {
            console.error('Error fetching messages:', err);
            setError(err.message);
        } finally {
            if (isInitialLoad) setLoading(false);
            setLoadingMore(false);
        }
    }, [channelId, currentUser?.id, oldestMessageTimestamp]);

    // Initial fetch
    useEffect(() => {
        if (channelId && currentUser?.id) {
            fetchMessages(true);
        } else {
            setMessages([]);
            setLoading(false);
            setHasMoreMessages(true);
            setOldestMessageTimestamp(null);
        }
    }, [channelId, currentUser?.id]); // Removed fetchMessages from here to avoid loop, will be called by channelId/userId change

    // Real-time subscriptions
    useEffect(() => {
        if (!channelId || !currentUser?.id) return;

        const handleInserts = (payload) => {
            // console.log('Message insert received:', payload.new);
            const newMessage = {
                ...payload.new,
                createdAt: toDateSafe(payload.new.created_at),
                updatedAt: toDateSafe(payload.new.updated_at),
                 // TODO: Fetch author profile separately if not included in payload or handle missing
                author: payload.new.user_id ? { id: payload.new.user_id, displayName: 'Loading User...' } : {displayName: 'Unknown User'}
            };
            // Ideally, fetch profile for author: supabase.from('profiles').select('*').eq('id', payload.new.user_id).single();

            setMessages(prevMessages => {
                if (prevMessages.find(m => m.id === newMessage.id)) return prevMessages; // Avoid duplicates
                return [...prevMessages, newMessage].sort((a,b) => a.createdAt - b.createdAt);
            });
        };

        const handleUpdates = (payload) => {
            // console.log('Message update received:', payload.new);
            const updatedMessage = {
                ...payload.new,
                createdAt: toDateSafe(payload.new.created_at),
                updatedAt: toDateSafe(payload.new.updated_at),
                // TODO: Fetch author profile if needed
            };
            setMessages(prevMessages => 
                prevMessages.map(msg => msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg)
                           .sort((a,b) => a.createdAt - b.createdAt)
            );
        };

        const handleDeletes = (payload) => {
            // console.log('Message delete received:', payload.old);
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== payload.old.id));
        };

        const messagesSubscription = supabase
            .channel(`public:messages:channel_id=eq.${channelId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, handleInserts)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, handleUpdates)
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, handleDeletes)
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to messages channel!');
                    // Potentially refetch to ensure consistency after subscription
                    // fetchMessages(true); // This might cause duplicate fetches, be careful
                }
            });

        return () => {
            supabase.removeChannel(messagesSubscription);
        };
    }, [channelId, currentUser?.id]);


    const sendMessage = async (content, attachments = []) => {
        if (!channelId || !currentUser || !content?.trim()) {
            // setError('Cannot send empty message or user not available.');
            console.warn('Cannot send empty message, or user/channel not available.');
            return null;
        }

        try {
            setError(null);
            const messageData = {
                content: content.trim(),
                user_id: currentUser.id, // Supabase uses user_id from auth typically
                channel_id: channelId,
                attachments: attachments || [], // Ensure this structure matches your DB (e.g., JSONB array of objects)
                // reactions: [], // Default value if you have this column
                // reply_count: 0, // Default value
                // created_at will be set by Supabase by default (or use new Date().toISOString())
                // updated_at will be set by Supabase by default
            };

            const { data: newMessage, error: insertError } = await supabase
                .from('messages')
                .insert(messageData)
                .select('*, author:profiles(*)') // Fetch inserted message with author profile
                .single();

            if (insertError) throw insertError;
            
            // The real-time listener should pick this up, so manual state update might not be needed
            // or could lead to duplicates if not handled carefully.
            // However, if you want optimistic updates or ensure immediate display:
            /*
            setMessages(prevMessages => [...prevMessages, {
                ...newMessage,
                createdAt: toDateSafe(newMessage.created_at),
                updatedAt: toDateSafe(newMessage.updated_at),
                author: newMessage.author ? { 
                    id: newMessage.user_id, 
                    displayName: newMessage.author.display_name || newMessage.author.username, 
                    avatar: newMessage.author.avatar_url 
                } : { id: newMessage.user_id, displayName: 'Current User'} // Placeholder if profile not immediately available
            }].sort((a,b) => a.createdAt - b.createdAt));
            */
            return newMessage;

        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message: ' + error.message);
            throw error; // Re-throw for the component to handle
        }
    };

    const loadMoreMessages = useCallback(() => {
        if (loadingMore || !hasMoreMessages) return;
        fetchMessages(false);
    }, [loadingMore, hasMoreMessages, fetchMessages]);

    // TODO: Refactor deleteMessage, editMessage, togglePinMessage, etc.
    // These will require careful adaptation of permissions and Supabase client calls.

    // Example: Basic structure for deleteMessage (needs more work)
    const deleteMessage = async (messageId, // options = {} // softDelete, reason, etc.
    ) => {
        if (!currentUser || !messageId) {
            setError("Cannot delete message: User or message ID missing.");
            return false;
        }
        // setDeletingMessages(prev => new Set(prev).add(messageId)); // For UI
        try {
            setError(null);
            // TODO: Permission check (canDeleteMessage adapted for Supabase)
            // const hasPermission = await canDeleteMessageSupabase(messageId, currentUser, channelId);
            // if (!hasPermission) throw new Error("You don't have permission to delete this message.");

            // TODO: Handle attachments deletion from Supabase Storage
            // const messageToDelete = messages.find(m => m.id === messageId);
            // if (messageToDelete?.attachments?.length > 0) {
            //    await handleSupabaseAttachmentsDelete(messageToDelete.attachments);
            // }
            
            const { error: deleteError } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId);

            if (deleteError) throw deleteError;
            
            // Real-time listener should remove it, or:
            // setMessages(prev => prev.filter(m => m.id !== messageId));
            return true;
        } catch (err) {
            console.error('Error deleting message:', err);
            setError('Failed to delete message: ' + err.message);
            return false;
        } finally {
            // setDeletingMessages(prev => { const s = new Set(prev); s.delete(messageId); return s; });
        }
    };


    return {
        messages,
        loading,
        error,
        sendMessage,
        loadMoreMessages,
        hasMoreMessages,
        loadingMore,
        deleteMessage, // Placeholder
        // editMessage, // Placeholder
        // togglePinMessage, // Placeholder
        // ... other functions
    };
};