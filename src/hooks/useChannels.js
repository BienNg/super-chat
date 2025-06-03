// src/hooks/useChannels.js
import { useState, useEffect, useRef } from 'react';
import { 
    collection, 
    query, 
    where, 
    onSnapshot, 
    orderBy,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { logRealtimeListener, logFirebaseRead } from '../utils/comprehensiveFirebaseTracker';

export const useChannels = () => {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth();
    
    // Add cache ref to prevent unnecessary re-subscriptions
    const unsubscribeRef = useRef(null);
    const currentUserIdRef = useRef(null);
    const channelCacheRef = useRef(new Map());

    useEffect(() => {
        if (!currentUser?.uid) {
            setChannels([]);
            setLoading(false);
            return;
        }

        // If same user and we already have a listener, don't create a new one
        if (currentUserIdRef.current === currentUser.uid && unsubscribeRef.current) {
            return;
        }

        // Clean up previous listener if it exists
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        currentUserIdRef.current = currentUser.uid;
        setLoading(true);
        
        // Query channels where user is a member
        // OPTIMIZATION: This is essential for core functionality, keeping real-time
        const channelsQuery = query(
            collection(db, 'channels'),
            where('members', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc') // Changed from updatedAt to createdAt for new channels
        );

        const unsubscribe = onSnapshot(
            channelsQuery,
            {
                next: (snapshot) => {
                    // Log the Firebase read operation
                    logRealtimeListener('channels', snapshot.size, `Real-time channels listener for user ${currentUser.uid}`);
                    
                    const channelData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    // Sort channels alphabetically by name
                    const sortedChannels = channelData.sort((a, b) => 
                        a.name.localeCompare(b.name)
                    );
                    setChannels(sortedChannels);
                    setLoading(false);
                    setError(null);
                },
                error: (err) => {
                    // Log the error
                    logRealtimeListener('channels', 0, `Channels listener error: ${err.message}`);
                    console.error('Error fetching channels:', err);
                    setError(err.message);
                    setLoading(false);
                }
            }
        );

        unsubscribeRef.current = unsubscribe;

        return () => {
            // Ensure proper cleanup of channels listener
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [currentUser?.uid]);

    const getChannelById = async (channelId) => {
        // Check cache first
        if (channelCacheRef.current.has(channelId)) {
            return channelCacheRef.current.get(channelId);
        }

        try {
            const channelRef = doc(db, 'channels', channelId);
            const channelSnap = await getDoc(channelRef);
            
            // Log the Firebase read operation
            logFirebaseRead('channels', channelSnap.exists() ? 1 : 0, `Single channel read for ${channelId}`);
            
            const result = channelSnap.exists() ? { id: channelSnap.id, ...channelSnap.data() } : null;
            
            // Cache the result
            channelCacheRef.current.set(channelId, result);
            
            return result;
        } catch (error) {
            // Log the error
            logFirebaseRead('channels', 0, `Channel read error for ${channelId}: ${error.message}`);
            console.error('Error fetching channel:', error);
            return null;
        }
    };

    return {
        channels,
        loading,
        error,
        getChannelById
    };
};