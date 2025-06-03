// src/hooks/useChannelManagement.js (Updated with notifications and caching)
import { useState, useRef, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useChannelManagement = () => {
    const [loading, setLoading] = useState(false);
    const usersCache = useRef(null);
    const lastFetchTime = useRef(0);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    const sendNotification = async (userId, type, channelId, channelName) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                userId,
                type, // 'channel_added', 'channel_removed', 'channel_deleted'
                title: type === 'channel_added' 
                    ? `Added to #${channelName}` 
                    : type === 'channel_removed'
                    ? `Removed from #${channelName}`
                    : `Channel #${channelName} deleted`,
                message: type === 'channel_added'
                    ? `You've been added to the ${channelName} channel`
                    : type === 'channel_removed'
                    ? `You've been removed from the ${channelName} channel`
                    : `The ${channelName} channel has been deleted`,
                channelId,
                channelName,
                read: false,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const addMemberToChannel = async (channelId, userId, channelName = '') => {
        try {
            setLoading(true);
            const channelRef = doc(db, 'channels', channelId);
            await updateDoc(channelRef, {
                members: arrayUnion(userId),
                updatedAt: serverTimestamp()
            });
            
            // Send notification
            await sendNotification(userId, 'channel_added', channelId, channelName);
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeMemberFromChannel = async (channelId, userId, channelName = '') => {
        try {
            setLoading(true);
            const channelRef = doc(db, 'channels', channelId);
            await updateDoc(channelRef, {
                members: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });
            
            // Send notification
            await sendNotification(userId, 'channel_removed', channelId, channelName);
        } catch (error) {
            console.error('Error removing member:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const bulkAddMembers = async (channelId, userIds, channelName = '') => {
        try {
            setLoading(true);
            const channelRef = doc(db, 'channels', channelId);
            await updateDoc(channelRef, {
                members: arrayUnion(...userIds),
                updatedAt: serverTimestamp()
            });
            
            // Send notifications to all added users
            const notificationPromises = userIds.map((userId) =>
                sendNotification(userId, 'channel_added', channelId, channelName)
            );
            await Promise.all(notificationPromises);
        } catch (error) {
            console.error('Error bulk adding members:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const bulkRemoveMembers = async (channelId, userIds, channelName = '') => {
        try {
            setLoading(true);
            const channelRef = doc(db, 'channels', channelId);
            await updateDoc(channelRef, {
                members: arrayRemove(...userIds),
                updatedAt: serverTimestamp()
            });
            
            // Send notifications to all removed users
            const notificationPromises = userIds.map((userId) =>
                sendNotification(userId, 'channel_removed', channelId, channelName)
            );
            await Promise.all(notificationPromises);
        } catch (error) {
            console.error('Error bulk removing members:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getAllUsers = async () => {
        try {
            const currentTime = Date.now();
            if (usersCache.current && currentTime - lastFetchTime.current < CACHE_DURATION) {
                return usersCache.current;
            }

            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const users = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            usersCache.current = users;
            lastFetchTime.current = currentTime;
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    };

    const deleteChannel = async (channelId, channelName = '') => {
        try {
            setLoading(true);
            
            // Get channel data first to notify members
            const channelRef = doc(db, 'channels', channelId);
            const channelDoc = await getDoc(channelRef);
            
            if (!channelDoc.exists()) {
                throw new Error('Channel not found');
            }

            const channel = channelDoc.data();

            // Create a batch for atomic operations
            const batch = writeBatch(db);

            // Delete all messages in the channel
            const messagesQuery = query(collection(db, 'channels', channelId, 'messages'));
            const messagesSnapshot = await getDocs(messagesQuery);
            
            messagesSnapshot.docs.forEach((messageDoc) => {
                batch.delete(messageDoc.ref);
            });

            // Delete the channel document
            batch.delete(channelRef);

            // Commit the batch
            await batch.commit();

            // Send notifications to all members
            if (channel.members && channel.members.length > 0) {
                const notificationPromises = channel.members.map((userId) =>
                    sendNotification(userId, 'channel_deleted', channelId, channelName)
                );
                await Promise.all(notificationPromises);
            }

            return { success: true, channelId };
        } catch (error) {
            console.error('Error deleting channel:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        addMemberToChannel,
        removeMemberFromChannel,
        bulkAddMembers,
        bulkRemoveMembers,
        getAllUsers,
        deleteChannel
    };
};