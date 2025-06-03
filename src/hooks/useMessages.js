// src/hooks/useMessages.js
import { useState, useEffect } from 'react';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    writeBatch,
    arrayRemove,
    serverTimestamp,
    limit,
    where
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { logRealtimeListener, logFirebaseRead, logFirebaseWrite } from '../utils/comprehensiveFirebaseTracker';

export const useMessages = (channelId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingMessages, setDeletingMessages] = useState(new Set());
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState(null);
    
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        if (!channelId) {
            setMessages([]);
            setLoading(false);
            setHasMoreMessages(true);
            setLoadingMore(false);
            return;
        }

        // Reset state for new channel
        setMessages([]);
        setLoading(true);
        setHasMoreMessages(true);
        setLoadingMore(false);
        
        // Query messages in channel, ordered by timestamp (DESC to get latest messages)
        // OPTIMIZATION: Reduced limit from 25 to 10 to minimize Firestore reads
        const messagesQuery = query(
            collection(db, 'channels', channelId, 'messages'),
            orderBy('createdAt', 'desc'), // Changed to desc to get latest messages
            limit(10) // Reduced for performance and quota management
        );

        const unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
                // Log the Firebase read operation - THIS IS LIKELY YOUR HIGH USAGE SOURCE
                logRealtimeListener('messages', snapshot.size, `Real-time messages listener for channel ${channelId}`);
                
                const messageData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Reverse to get chronological order (oldest first)
                const newMessages = messageData.reverse();
                
                if (newMessages.length === 0) {
                    setMessages([]);
                    setLoading(false);
                    setError(null);
                    return;
                }

                setMessages(prevMessages => {
                    // If this is the first load, replace all messages
                    if (prevMessages.length === 0) {
                        return newMessages;
                    }

                    // For subsequent updates, we need to be more careful
                    // The issue is that Firestore only returns the latest 10 messages
                    // So we need to preserve older messages that were previously loaded
                    
                    // Find truly new messages (not in our current list)
                    const existingMessageIds = new Set(prevMessages.map(msg => msg.id));
                    const trulyNewMessages = newMessages.filter(msg => !existingMessageIds.has(msg.id));
                    
                    // Update existing messages (for edits, deletions, etc.)
                    const updatedPrevMessages = prevMessages.map(prevMsg => {
                        const updatedMsg = newMessages.find(newMsg => newMsg.id === prevMsg.id);
                        return updatedMsg || prevMsg; // Keep original if not found in new data
                    });
                    
                    // Only append truly new messages
                    if (trulyNewMessages.length > 0) {
                        return [...updatedPrevMessages, ...trulyNewMessages];
                    }
                    
                    // If no new messages, just return updated existing messages
                    return updatedPrevMessages;
                });

                setLoading(false);
                setError(null);
                
                // Check if we have fewer messages than limit (means no more to load)
                if (messageData.length < 10) {
                    setHasMoreMessages(false);
                }
            },
            (err) => {
                // Log the error
                logRealtimeListener('messages', 0, `Messages listener error for channel ${channelId}: ${err.message}`);
                console.error('Error fetching messages:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => {
            // Ensure proper cleanup of listener
            unsubscribe();
        };
    }, [channelId]);

    const sendMessage = async (content, attachments = []) => {
        if (!channelId || !currentUser || !content?.trim()) {
            return;
        }

        try {
            const messageData = {
                content: content.trim(),
                authorId: currentUser.uid,
                author: {
                    id: currentUser.uid,
                    displayName: userProfile?.displayName || userProfile?.fullName || currentUser.displayName,
                    email: currentUser.email,
                    avatar: userProfile?.photo || null
                },
                attachments: attachments || [],
                reactions: [],
                replyCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                deleted: false,
                deletedAt: null,
                deletedBy: null,
                deletionType: null
            };

            await addDoc(collection(db, 'channels', channelId, 'messages'), messageData);
            
            // Log the Firebase write operation
            logFirebaseWrite('messages', `Message sent to channel ${channelId}`);
        } catch (error) {
            // Log the error
            logFirebaseWrite('messages', `Message send error for channel ${channelId}: ${error.message}`);
            console.error('Error sending message:', error);
            throw error;
        }
    };

    // Permission check for message deletion
    const canDeleteMessage = async (message) => {
        if (!currentUser || !message) return false;

        // User can delete their own messages
        if (message.authorId === currentUser.uid) return true;

        // Check if user is channel admin/moderator
        try {
            const channelDoc = await getDoc(doc(db, 'channels', channelId));
            if (channelDoc.exists()) {
                const channelData = channelDoc.data();
                if (channelData.admins?.includes(currentUser.uid) || 
                    channelData.moderators?.includes(currentUser.uid)) {
                    return true;
                }
            }
        } catch (error) {
            console.error('Error checking channel permissions:', error);
        }

        // Check if user is system admin
        if (userProfile?.role === 'admin') return true;

        return false;
    };

    // Check if message is within edit window
    const isWithinEditWindow = (message, editWindowMinutes = 15) => {
        if (!message.createdAt) return false;
        
        const messageTime = message.createdAt.toDate();
        const now = new Date();
        const diffMinutes = (now - messageTime) / (1000 * 60);
        
        return diffMinutes <= editWindowMinutes;
    };

    // Check if message has replies
    const hasReplies = async (messageId) => {
        try {
            const repliesQuery = query(
                collection(db, 'channels', channelId, 'messages', messageId, 'replies'),
                limit(1)
            );
            const repliesSnapshot = await getDocs(repliesQuery);
            return !repliesSnapshot.empty;
        } catch (error) {
            console.error('Error checking replies:', error);
            return false;
        }
    };

    // Handle file attachments on deletion
    const handleAttachmentsOnDelete = async (message, deleteType) => {
        if (!message.attachments?.length || deleteType !== 'hard') return;

        try {
            const storage = getStorage();
            const deletePromises = message.attachments.map(attachment => {
                if (attachment.storageRef) {
                    return deleteObject(ref(storage, attachment.storageRef));
                }
                return null; // Return null for attachments without storageRef
            }).filter(promise => promise !== null); // Filter out null values
            
            await Promise.allSettled(deletePromises);
        } catch (error) {
            console.error('Error deleting attachments:', error);
        }
    };

    // Handle pinned message removal
    const handlePinnedMessageDeletion = async (messageId) => {
        try {
            const channelRef = doc(db, 'channels', channelId);
            const channelDoc = await getDoc(channelRef);
            
            if (channelDoc.exists()) {
                const pinnedMessages = channelDoc.data().pinnedMessages || [];
                if (pinnedMessages.includes(messageId)) {
                    await updateDoc(channelRef, {
                        pinnedMessages: arrayRemove(messageId)
                    });
                }
            }
        } catch (error) {
            console.error('Error removing pinned message:', error);
        }
    };

    // Handle reactions on deletion
    const handleReactionsOnDelete = async (messageId, deleteType) => {
        if (deleteType !== 'hard') return;

        try {
            const reactionsRef = collection(db, 'channels', channelId, 'messages', messageId, 'reactions');
            const batch = writeBatch(db);
            
            const reactionsSnapshot = await getDocs(reactionsRef);
            reactionsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            if (!reactionsSnapshot.empty) {
                await batch.commit();
            }
        } catch (error) {
            console.error('Error deleting reactions:', error);
        }
    };

    // Edit message function
    const editMessage = async (messageId, newContent) => {
        if (!messageId || !channelId || !currentUser || !newContent?.trim()) {
            throw new Error('Missing required parameters for message editing');
        }

        // Find the message
        const message = messages.find(msg => msg.id === messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        // Check if user can edit (only author can edit their own messages)
        if (message.authorId !== currentUser.uid) {
            throw new Error('You can only edit your own messages');
        }

        // Check if message is within edit window
        if (!isWithinEditWindow(message)) {
            throw new Error('Message can no longer be edited (15 minute window expired)');
        }

        try {
            const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
            await updateDoc(messageRef, {
                content: newContent.trim(),
                editedAt: serverTimestamp(),
                editedBy: currentUser.uid
            });

            // Log the Firebase write operation
            logFirebaseWrite('messages', `Message edited in channel ${channelId}`);

            return { success: true, messageId };
        } catch (error) {
            // Log the error
            logFirebaseWrite('messages', `Message edit error in channel ${channelId}: ${error.message}`);
            console.error('Error editing message:', error);
            throw error;
        }
    };

    // Pin/unpin message function
    const togglePinMessage = async (messageId) => {
        if (!messageId || !channelId || !currentUser) {
            throw new Error('Missing required parameters for message pinning');
        }

        try {
            const channelRef = doc(db, 'channels', channelId);
            const channelDoc = await getDoc(channelRef);
            
            if (!channelDoc.exists()) {
                throw new Error('Channel not found');
            }

            const channelData = channelDoc.data();
            const pinnedMessages = channelData.pinnedMessages || [];
            const isPinned = pinnedMessages.includes(messageId);

            // Check permissions (admins, moderators, or message author)
            const message = messages.find(msg => msg.id === messageId);
            const canPin = message?.authorId === currentUser.uid ||
                          channelData.admins?.includes(currentUser.uid) ||
                          channelData.moderators?.includes(currentUser.uid) ||
                          userProfile?.role === 'admin';

            if (!canPin) {
                throw new Error('You do not have permission to pin messages in this channel');
            }

            let updatedPinnedMessages;
            if (isPinned) {
                // Unpin message
                updatedPinnedMessages = pinnedMessages.filter(id => id !== messageId);
            } else {
                // Pin message (limit to 50 pinned messages)
                if (pinnedMessages.length >= 50) {
                    throw new Error('Channel has reached the maximum number of pinned messages (50)');
                }
                updatedPinnedMessages = [...pinnedMessages, messageId];
            }

            await updateDoc(channelRef, {
                pinnedMessages: updatedPinnedMessages,
                lastPinnedAt: serverTimestamp(),
                lastPinnedBy: currentUser.uid
            });

            return { 
                success: true, 
                messageId, 
                isPinned: !isPinned,
                pinnedCount: updatedPinnedMessages.length 
            };

        } catch (error) {
            console.error('Error toggling pin message:', error);
            throw error;
        }
    };

    // Get pinned messages for channel
    const getPinnedMessages = async () => {
        if (!channelId) return [];

        try {
            const channelRef = doc(db, 'channels', channelId);
            const channelDoc = await getDoc(channelRef);
            
            if (!channelDoc.exists()) {
                return [];
            }

            const pinnedMessageIds = channelDoc.data().pinnedMessages || [];
            
            // Get the actual message data for pinned messages
            const pinnedMessages = messages.filter(msg => 
                pinnedMessageIds.includes(msg.id) && !msg.deleted
            );

            return pinnedMessages;
        } catch (error) {
            console.error('Error getting pinned messages:', error);
            return [];
        }
    };

    // Check if message is pinned
    const isMessagePinned = async (messageId) => {
        if (!channelId || !messageId) return false;

        try {
            const channelRef = doc(db, 'channels', channelId);
            const channelDoc = await getDoc(channelRef);
            
            if (!channelDoc.exists()) {
                return false;
            }

            const pinnedMessages = channelDoc.data().pinnedMessages || [];
            return pinnedMessages.includes(messageId);
        } catch (error) {
            console.error('Error checking if message is pinned:', error);
            return false;
        }
    };

    // Main delete message function
    const deleteMessage = async (messageId, options = {}) => {
        if (!messageId || !channelId || !currentUser) {
            throw new Error('Missing required parameters for message deletion');
        }

        // Find the message
        const message = messages.find(msg => msg.id === messageId);
        if (!message) {
            throw new Error('Message not found');
        }

        // Check permissions
        const hasPermission = await canDeleteMessage(message);
        if (!hasPermission) {
            throw new Error('You do not have permission to delete this message');
        }

        // Check if already being deleted
        if (deletingMessages.has(messageId)) {
            throw new Error('Message is already being deleted');
        }

        setDeletingMessages(prev => new Set(prev).add(messageId));

        try {
            const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
            
            // Determine deletion type
            let deleteType = options.deleteType || 'soft';
            
            // Force soft delete if message has replies (unless explicitly overridden)
            if (!options.forceHard) {
                const messageHasReplies = await hasReplies(messageId);
                if (messageHasReplies) {
                    deleteType = 'soft';
                }
            }

            // Check time window for regular users
            const isOwnMessage = message.authorId === currentUser.uid;
            const withinEditWindow = isWithinEditWindow(message);
            
            if (isOwnMessage && !withinEditWindow && !userProfile?.role === 'admin') {
                throw new Error('You can only delete your own messages within 15 minutes of posting');
            }

            if (deleteType === 'soft') {
                // Soft delete: mark as deleted but preserve data
                await updateDoc(messageRef, {
                    deleted: true,
                    deletedAt: serverTimestamp(),
                    deletedBy: currentUser.uid,
                    deletionType: 'soft',
                    deletionReason: options.reason || null
                });
                
                // Log the Firebase write operation
                logFirebaseWrite('messages', `Message soft deleted in channel ${channelId}`);
            } else {
                // Hard delete: remove completely
                await handleAttachmentsOnDelete(message, 'hard');
                await handleReactionsOnDelete(messageId, 'hard');
                await handlePinnedMessageDeletion(messageId);
                
                // Delete the message document
                await deleteDoc(messageRef);
                
                // Log the Firebase write operation
                logFirebaseWrite('messages', `Message hard deleted in channel ${channelId}`);
            }

            return {
                success: true,
                deleteType,
                messageId,
                canUndo: deleteType === 'soft'
            };

        } catch (error) {
            // Log the error
            logFirebaseWrite('messages', `Message delete error in channel ${channelId}: ${error.message}`);
            console.error('Error deleting message:', error);
            throw error;
        } finally {
            setDeletingMessages(prev => {
                const newSet = new Set(prev);
                newSet.delete(messageId);
                return newSet;
            });
        }
    };

    // Undo soft delete
    const undoDeleteMessage = async (messageId) => {
        if (!messageId || !channelId) {
            throw new Error('Missing required parameters for undo');
        }

        try {
            const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
            const messageDoc = await getDoc(messageRef);
            
            if (!messageDoc.exists()) {
                throw new Error('Message not found');
            }

            const messageData = messageDoc.data();
            if (!messageData.deleted || messageData.deletionType !== 'soft') {
                throw new Error('Message cannot be restored');
            }

            // Check if user can undo (original author or admin)
            const canUndo = messageData.authorId === currentUser.uid || 
                           messageData.deletedBy === currentUser.uid ||
                           userProfile?.role === 'admin';
            
            if (!canUndo) {
                throw new Error('You do not have permission to restore this message');
            }

            await updateDoc(messageRef, {
                deleted: false,
                deletedAt: null,
                deletedBy: null,
                deletionType: null,
                deletionReason: null,
                restoredAt: serverTimestamp(),
                restoredBy: currentUser.uid
            });

            return { success: true, messageId };

        } catch (error) {
            console.error('Error undoing message deletion:', error);
            throw error;
        }
    };

    // Load more messages (pagination)
    const loadMoreMessages = async () => {
        if (!channelId || !hasMoreMessages || loadingMore) return;

        try {
            setLoadingMore(true);
            
            // Get the oldest message timestamp for pagination
            const oldestMessage = messages[0];
            if (!oldestMessage) return;

            const moreMessagesQuery = query(
                collection(db, 'channels', channelId, 'messages'),
                orderBy('createdAt', 'desc'),
                where('createdAt', '<', oldestMessage.createdAt),
                limit(10)
            );

            const snapshot = await getDocs(moreMessagesQuery);
            
            // Log the Firebase read operation
            logFirebaseRead('messages', snapshot.size, `Load more messages for channel ${channelId}`);
            
            if (snapshot.empty) {
                setHasMoreMessages(false);
                return;
            }

            const moreMessages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            // Prepend to existing messages (since we're loading older ones)
            setMessages(prev => [...moreMessages.reverse(), ...prev]);
            
            // Check if we've reached the beginning
            if (snapshot.docs.length < 10) {
                setHasMoreMessages(false);
            }

        } catch (error) {
            // Log the error
            logFirebaseRead('messages', 0, `Load more messages error for channel ${channelId}: ${error.message}`);
            console.error('Error loading more messages:', error);
            setError(error.message);
        } finally {
            setLoadingMore(false);
        }
    };

    return {
        messages,
        loading,
        error,
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
        // Pagination functionality
        hasMoreMessages,
        loadingMore,
        loadMoreMessages
    };
};