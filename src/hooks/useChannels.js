// src/hooks/useChannels.js
import { useState, useEffect, useRef } from 'react';
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

    useEffect(() => {
        const userId = currentUser?.id;

        if (!userId) {
            setChannels([]);
            setLoading(false);
            if (unsubscribeRef.current) {
                // supabase.removeChannel needs the channel object itself
                // unsubscribeRef.current.unsubscribe(); // This is for direct PG, Supabase client is different
                supabase.removeChannel(unsubscribeRef.current)
                unsubscribeRef.current = null;
            }
            currentUserIdRef.current = null;
            return;
        }

        if (currentUserIdRef.current === userId && unsubscribeRef.current && unsubscribeRef.current.state === 'joined') {
            setLoading(false); 
            return;
        }

        if (unsubscribeRef.current) {
             supabase.removeChannel(unsubscribeRef.current)
            unsubscribeRef.current = null;
        }

        currentUserIdRef.current = userId;
        setLoading(true);
        setError(null);
        
        const fetchChannels = async () => {
            try {
                setLoading(true); 
                const { data, error: fetchError } = await supabase
                    .from('channels')
                    .select('*')
                    .contains('members', [userId]) 
                    .order('name', { ascending: true }); 
                
                if (fetchError) {
                    console.error('Error fetching channels from Supabase:', fetchError);
                    setError(fetchError.message);
                    setChannels([]); 
                } else {
                    setChannels(data || []);
                    setError(null);
                }
            } catch (err) {
                console.error('Error in Supabase fetchChannels:', err);
                setError(err.message);
                setChannels([]);
            } finally {
                setLoading(false);
            }
        };
            
        fetchChannels(); 

        const uniqueChannelName = `realtime:channels:user:${userId}`;
        const channelSubscription = supabase
            .channel(uniqueChannelName)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'channels',
                    // RLS will ensure user only gets updates for channels they are members of.
                    // The `contains` filter on fetchChannels handles the initial data load correctly.
                    // Re-fetching on any change to the 'channels' table (that RLS allows the user to see) is a common pattern.
                }, 
                (payload) => {
                    // console.log('Channel change detected, refetching for user:', userId, payload);
                    fetchChannels(); 
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    // console.log(`Successfully subscribed to ${uniqueChannelName}`);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error(`Subscription error on ${uniqueChannelName} for user ${userId}:`, status, err);
                    setError(`Realtime subscription failed: ${status}. Please check RLS policies on the channels table.`);
                } else if (status === 'CLOSED'){
                    // console.log(`Subscription to ${uniqueChannelName} closed.`);
                }
            });
        
        unsubscribeRef.current = channelSubscription;
        
        return () => {
            if (unsubscribeRef.current) {
                supabase.removeChannel(unsubscribeRef.current);
                unsubscribeRef.current = null;
                // console.log(`Unsubscribed from ${uniqueChannelName} for user ${userId}`);
            }
        };
    }, [currentUser?.id]); 

    const getChannelById = async (channelId) => {
        if (!channelId) return null;
        if (channelCacheRef.current.has(channelId)) {
            const cachedChannel = channelCacheRef.current.get(channelId);
            // Ensure cache returns a promise-like structure or handle appropriately where called
            return cachedChannel;
        }
        
        // setLoading(true); // Avoid global loading for a single get by ID if used independently
        let localLoading = true; // Or manage local loading state if needed

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
                // setError(fetchError.message); // Avoid setting global error for a single get
                throw fetchError; // Re-throw for local handling
            }
            
            channelCacheRef.current.set(channelId, data);
            return data;
        } catch (err) {
            console.error('Error in Supabase getChannelById:', err);
            // setError(err.message); // Avoid setting global error
            throw err; // Re-throw for local handling
        } finally {
            // setLoading(false);
            localLoading = false;
        }
    };

    return {
        channels,
        loading,
        error,
        getChannelById
    };
};