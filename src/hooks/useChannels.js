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
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { logRealtimeListener, logFirebaseRead } from '../utils/comprehensiveFirebaseTracker';

// Flag to determine if we should use Supabase instead of Firebase
const USE_SUPABASE = true;

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
        if (!currentUser?.uid && !currentUser?.id) {
            setChannels([]);
            setLoading(false);
            return;
        }

        const userId = currentUser?.id || currentUser?.uid;

        // If same user and we already have a listener, don't create a new one
        if (currentUserIdRef.current === userId && unsubscribeRef.current) {
            return;
        }

        // Clean up previous listener if it exists
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        currentUserIdRef.current = userId;
        setLoading(true);
        
        if (USE_SUPABASE) {
            // Fetch channels from Supabase
            const fetchChannels = async () => {
                try {
                    const { data, error } = await supabase
                        .from('channels')
                        .select('*')
                        .contains('members', [userId]);
                    
                    if (error) {
                        console.error('Error fetching channels from Supabase:', error);
                        setError(error.message);
                        setLoading(false);
                        return;
                    }
                    
                    // Set up subscription for realtime updates
                    const channelSubscription = supabase
                        .channel('channels-changes')
                        .on('postgres_changes', 
                            { 
                                event: '*', 
                                schema: 'public', 
                                table: 'channels',
                                filter: `members=cs.{${userId}}`
                            }, 
                            () => {
                                fetchChannels(); // Refetch when changes occur
                            }
                        )
                        .subscribe();
                    
                    // Sort channels alphabetically by name
                    const sortedChannels = data ? [...data].sort((a, b) => 
                        a.name.localeCompare(b.name)
                    ) : [];
                    
                    setChannels(sortedChannels);
                    setLoading(false);
                    setError(null);
                    
                    // Store the unsubscribe function
                    unsubscribeRef.current = () => {
                        channelSubscription.unsubscribe();
                    };
                } catch (err) {
                    console.error('Error in Supabase channels setup:', err);
                    setError(err.message);
                    setLoading(false);
                }
            };
            
            fetchChannels();
            
            return () => {
                if (unsubscribeRef.current) {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }
            };
        } else {
            // Original Firebase implementation
            // Query channels where user is a member
            const channelsQuery = query(
                collection(db, 'channels'),
                where('members', 'array-contains', userId),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(
                channelsQuery,
                {
                    next: (snapshot) => {
                        // Log the Firebase read operation
                        logRealtimeListener('channels', snapshot.size, `Real-time channels listener for user ${userId}`);
                        
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
                if (unsubscribeRef.current) {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }
            };
        }
    }, [currentUser?.uid, currentUser?.id]);

    const getChannelById = async (channelId) => {
        // Check cache first
        if (channelCacheRef.current.has(channelId)) {
            return channelCacheRef.current.get(channelId);
        }

        try {
            if (USE_SUPABASE) {
                // Get channel from Supabase
                const { data, error } = await supabase
                    .from('channels')
                    .select('*')
                    .eq('id', channelId)
                    .single();
                
                if (error) {
                    console.error('Error fetching channel from Supabase:', error);
                    return null;
                }
                
                // Cache the result
                channelCacheRef.current.set(channelId, data);
                
                return data;
            } else {
                // Original Firebase implementation
                const channelRef = doc(db, 'channels', channelId);
                const channelSnap = await getDoc(channelRef);
                
                // Log the Firebase read operation
                logFirebaseRead('channels', channelSnap.exists() ? 1 : 0, `Single channel read for ${channelId}`);
                
                const result = channelSnap.exists() ? { id: channelSnap.id, ...channelSnap.data() } : null;
                
                // Cache the result
                channelCacheRef.current.set(channelId, result);
                
                return result;
            }
        } catch (error) {
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