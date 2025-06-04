import { useState, useCallback } from 'react';
import { 
    collection, 
    query, 
    where, 
    getDocs,
    addDoc,
    setDoc,
    serverTimestamp,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * useDirectMessages - Custom hook for managing direct message functionality
 * Handles creating DM channels and managing DM conversations
 */
export const useDirectMessages = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { currentUser, userProfile } = useAuth();

    // Create or find existing DM channel between two users
    const createOrFindDMChannel = useCallback(async (otherUserId, otherUserData) => {
        if (!currentUser?.uid || !otherUserId || currentUser.uid === otherUserId) {
            throw new Error('Invalid users for DM channel');
        }

        try {
            setLoading(true);
            setError(null);

            // First, check if a DM channel already exists using a query
            const dmChannelsQuery = query(
                collection(db, 'channels'),
                where('isDM', '==', true),
                where('members', 'array-contains', currentUser.uid)
            );

            const existingChannelsSnapshot = await getDocs(dmChannelsQuery);
            const existingDMChannel = existingChannelsSnapshot.docs.find(doc => {
                const data = doc.data();
                return data.members && data.members.includes(otherUserId);
            });

            if (existingDMChannel) {
                return {
                    id: existingDMChannel.id,
                    ...existingDMChannel.data()
                };
            }

            // Create new DM channel
            const currentUserData = {
                id: currentUser.uid,
                displayName: userProfile?.displayName || userProfile?.fullName || currentUser.displayName || currentUser.email?.split('@')[0],
                email: currentUser.email,
                avatar: userProfile?.photo || null
            };

            const channelData = {
                name: `${currentUserData.displayName}, ${otherUserData.displayName || otherUserData.fullName}`,
                description: 'Direct message conversation',
                type: 'direct-message',
                isPrivate: true,
                isDM: true,
                members: [currentUser.uid, otherUserId],
                admins: [currentUser.uid, otherUserId], // Both users are admins of their DM
                moderators: [],
                createdBy: currentUser.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastActivity: serverTimestamp(),
                memberCount: 2,
                // Store participant data for easy access
                participants: {
                    [currentUser.uid]: currentUserData,
                    [otherUserId]: {
                        id: otherUserId,
                        displayName: otherUserData.displayName || otherUserData.fullName,
                        email: otherUserData.email,
                        avatar: otherUserData.photo || null
                    }
                }
            };

            // Use addDoc to let Firestore generate the ID
            const newChannelRef = await addDoc(collection(db, 'channels'), channelData);
            
            // Return the created channel with the generated ID
            return {
                id: newChannelRef.id,
                ...channelData
            };

        } catch (err) {
            console.error('Error creating/finding DM channel:', err);
            setError('Failed to create direct message channel');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [currentUser, userProfile]);

    // Get DM channels for current user
    const getDMChannels = useCallback(async () => {
        if (!currentUser?.uid) {
            return [];
        }

        try {
            // Query channels where current user is a member and it's a DM
            const dmChannelsQuery = query(
                collection(db, 'channels'),
                where('members', 'array-contains', currentUser.uid),
                where('isDM', '==', true)
            );

            const snapshot = await getDocs(dmChannelsQuery);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

        } catch (err) {
            console.error('Error fetching DM channels:', err);
            return [];
        }
    }, [currentUser?.uid]);

    // Get the other participant in a DM channel
    const getOtherParticipant = useCallback((dmChannel) => {
        if (!dmChannel?.participants || !currentUser?.uid) {
            return null;
        }

        const otherUserId = Object.keys(dmChannel.participants).find(
            userId => userId !== currentUser.uid
        );

        return otherUserId ? dmChannel.participants[otherUserId] : null;
    }, [currentUser?.uid]);

    // Check if a channel is a DM channel
    const isDMChannel = useCallback((channel) => {
        return channel?.isDM === true || channel?.type === 'direct-message';
    }, []);

    return {
        loading,
        error,
        createOrFindDMChannel,
        getDMChannels,
        getOtherParticipant,
        isDMChannel
    };
}; 