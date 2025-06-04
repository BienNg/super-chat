// src/hooks/useChannels.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Adjusted path
import { useAuth } from '../contexts/AuthContext';

export const useChannels = () => {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth(); // useAuth now provides Supabase user
    
    const unsubscribeRef = useRef(null);
    const currentUserIdRef = useRef(null);
    const channelCacheRef = useRef(new Map());
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    // Function to fetch channels - extracted for reuse
    const fetchChannels = useCallback(async (userId) => {
        if (!userId) return [];
        
        try {
            const { data, error: fetchError } = await supabase
                .from('channels')
                .select('*')
                .contains('members', [userId]) 
                .order('name', { ascending: true }); 
            
            if (fetchError) {
                console.error('Error fetching channels from Supabase:', fetchError);
                setError(fetchError.message);
                return [];
            }
            
            setError(null);
            return data || [];
        } catch (err) {
            console.error('Error in Supabase fetchChannels:', err);
            setError(err.message);
            return [];
        }
    }, []);

    // Setup realtime subscription with retry logic
    const setupRealtimeSubscription = useCallback((userId) => {
        if (!userId) return null;
        if (unsubscribeRef.current) {
            supabase.removeChannel(unsubscribeRef.current);
            unsubscribeRef.current = null;
        }

        // Use a unique channel name that includes the user ID
        const uniqueChannelName = `realtime:channels:user:${userId}:${Date.now()}`;
        
        try {
            const channelSubscription = supabase
                .channel(uniqueChannelName)
                .on('postgres_changes', 
                    { 
                        event: '*', 
                        schema: 'public', 
                        table: 'channels',
                    }, 
                    async (payload) => {
                        console.log('Channel change detected:', payload.eventType);
                        const updatedChannels = await fetchChannels(userId);
                        setChannels(updatedChannels);
                    }
                )
                .subscribe((status, err) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Successfully subscribed to channels for user: ${userId}`);
                        retryCountRef.current = 0; // Reset retry count on successful subscription
                    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                        console.error(`Subscription error for user ${userId}:`, status, err);
                        
                        // Implement retry logic
                        if (retryCountRef.current < maxRetries) {
                            retryCountRef.current++;
                            console.log(`Retrying subscription (${retryCountRef.current}/${maxRetries})...`);
                            
                            // Remove the failed channel and retry after a delay
                            if (unsubscribeRef.current) {
                                supabase.removeChannel(unsubscribeRef.current);
                                unsubscribeRef.current = null;
                            }
                            
                            setTimeout(() => {
                                if (currentUserIdRef.current === userId) {
                                    unsubscribeRef.current = setupRealtimeSubscription(userId);
                                }
                            }, 2000 * retryCountRef.current); // Exponential backoff
                        } else {
                            setError(`Realtime subscription failed after ${maxRetries} attempts. Using polling fallback.`);
                            // Fall back to polling instead of realtime
                            startPolling(userId);
                        }
                    }
                });
            
            return channelSubscription;
        } catch (err) {
            console.error('Error setting up realtime subscription:', err);
            setError(`Couldn't establish realtime connection: ${err.message}`);
            // Fall back to polling
            startPolling(userId);
            return null;
        }
    }, [fetchChannels]);

    // Fallback polling mechanism when realtime fails
    const pollingIntervalRef = useRef(null);
    const startPolling = useCallback((userId) => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
        
        // Poll every 10 seconds as a fallback
        pollingIntervalRef.current = setInterval(async () => {
            console.log('Polling for channel updates...');
            const updatedChannels = await fetchChannels(userId);
            setChannels(updatedChannels);
        }, 10000);
        
        // Do an immediate fetch
        fetchChannels(userId).then(setChannels);
    }, [fetchChannels]);

    // Stop polling if it's active
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        const userId = currentUser?.id;

        if (!userId) {
            setChannels([]);
            setLoading(false);
            stopPolling();
            
            if (unsubscribeRef.current) {
                supabase.removeChannel(unsubscribeRef.current);
                unsubscribeRef.current = null;
            }
            
            currentUserIdRef.current = null;
            return;
        }

        // If user hasn't changed and we have an active subscription, do nothing
        if (currentUserIdRef.current === userId && unsubscribeRef.current && unsubscribeRef.current.state === 'joined') {
            setLoading(false);
            return;
        }

        // Cleanup existing subscriptions
        if (unsubscribeRef.current) {
            supabase.removeChannel(unsubscribeRef.current);
            unsubscribeRef.current = null;
        }
        
        // Stop polling if active
        stopPolling();

        // Set new current user
        currentUserIdRef.current = userId;
        setLoading(true);
        
        // Fetch initial data
        fetchChannels(userId).then(data => {
            setChannels(data);
            setLoading(false);
        });

        // Setup new subscription
        unsubscribeRef.current = setupRealtimeSubscription(userId);
        
        // Cleanup function
        return () => {
            stopPolling();
            if (unsubscribeRef.current) {
                supabase.removeChannel(unsubscribeRef.current);
                unsubscribeRef.current = null;
            }
        };
    }, [currentUser?.id, fetchChannels, setupRealtimeSubscription, stopPolling]);

    const getChannelById = async (channelId) => {
        if (!channelId) return null;
        if (channelCacheRef.current.has(channelId)) {
            const cachedChannel = channelCacheRef.current.get(channelId);
            return cachedChannel;
        }
        
        try {
            const { data, error: fetchError } = await supabase
                .from('channels')
                .select('*')
                .eq('id', channelId)
                .single();
            
            if (fetchError) {
                if (fetchError.code === 'PGRST116') { 
                    channelCacheRef.current.set(channelId, null); 
                    return null;
                }
                console.error('Error fetching channel by ID from Supabase:', fetchError);
                throw fetchError;
            }
            
            channelCacheRef.current.set(channelId, data);
            return data;
        } catch (err) {
            console.error('Error in Supabase getChannelById:', err);
            throw err;
        }
    };

    return {
        channels,
        loading,
        error,
        getChannelById,
        refreshChannels: () => fetchChannels(currentUser?.id).then(setChannels)
    };
};