import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client
import { useAuth } from '../contexts/AuthContext';

/**
 * useDirectMessages - Custom hook for managing direct message functionality
 * Handles creating DM channels and managing DM conversations
 */
export const useDirectMessages = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { currentUser, userProfile } = useAuth(); // userProfile from AuthContext (Supabase 'profiles' table)

    const createOrFindDMChannel = useCallback(async (otherUserId, otherUserData) => {
        const currentUserId = currentUser?.id;
        if (!currentUserId || !otherUserId || currentUserId === otherUserId) {
            // setError('Invalid users for DM channel'); // Optionally set error state
            throw new Error('Invalid users for DM channel');
        }

        setLoading(true);
        setError(null);

        try {
            // Ensure members are always ordered consistently for querying (e.g., by ID)
            const membersArray = [currentUserId, otherUserId].sort();

            // Check if a DM channel already exists between these two users
            const { data: existingChannels, error: findError } = await supabase
                .from('channels')
                .select('*')
                .eq('is_dm', true)
                // .eq('type', 'direct-message') // Alternative or additional check for DM type
                .contains('members', membersArray) // Check if members array contains both (order might matter depending on DB)
                // A more robust query might be to check if members array *equals* membersArray after sorting,
                // or use array operators if members is a native array type in PG.
                // For JSONB, you might need a function or more complex query if order isn't guaranteed or if there are extra members.
                // Simplest for now: fetch channels containing both, then filter client-side for exact match of 2 members.

            if (findError) throw findError;

            const exactDMChannel = existingChannels?.find(ch => 
                ch.members.length === 2 && 
                ch.members.includes(currentUserId) && 
                ch.members.includes(otherUserId)
            );

            if (exactDMChannel) {
                setLoading(false);
                return exactDMChannel;
            }

            // Create new DM channel
            const currentTimestamp = new Date().toISOString();
            const currentUserDisplayData = {
                id: currentUserId,
                display_name: userProfile?.display_name || currentUser?.email?.split('@')[0],
                email: currentUser?.email,
                avatar_url: userProfile?.avatar_url || null // Assuming avatar_url from profiles
            };

            const otherUserDisplayData = {
                id: otherUserId,
                display_name: otherUserData?.display_name || otherUserData?.email?.split('@')[0],
                email: otherUserData?.email,
                avatar_url: otherUserData?.avatar_url || null
            };

            const channelData = {
                name: `${currentUserDisplayData.display_name}, ${otherUserDisplayData.display_name}`,
                description: 'Direct message conversation',
                type: 'direct-message',
                is_private: true,
                is_dm: true,
                members: membersArray, // Store sorted array
                admins: membersArray, 
                // moderators: [], // Assuming empty or not used for DMs
                created_by: currentUserId,
                created_at: currentTimestamp,
                updated_at: currentTimestamp,
                last_activity_at: currentTimestamp, // Use consistent naming, e.g. last_activity_at
                member_count: 2,
                participants_data: { // Store participant data in a JSONB field
                    [currentUserId]: currentUserDisplayData,
                    [otherUserId]: otherUserDisplayData
                }
            };

            const { data: newChannel, error: insertError } = await supabase
                .from('channels')
                .insert(channelData)
                .select()
                .single();

            if (insertError) throw insertError;
            setLoading(false);
            return newChannel;

        } catch (err) {
            console.error('Error creating/finding DM channel:', err);
            setError(err.message || 'Failed to create direct message channel');
            setLoading(false);
            throw err;
        }
    }, [currentUser, userProfile]);

    const getDMChannels = useCallback(async () => {
        const currentUserId = currentUser?.id;
        if (!currentUserId) return [];
        
        setLoading(true);
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('channels')
                .select('*') // Select all fields, including participants_data
                .eq('is_dm', true)
                .contains('members', [currentUserId])
                .order('last_activity_at', { ascending: false });

            if (fetchError) throw fetchError;
            
            const channelsWithParticipantInfo = (data || []).map(ch => {
                const otherUserIdInDM = ch.members.find(id => id !== currentUserId);
                const otherParticipantInfo = ch.participants_data && otherUserIdInDM ? ch.participants_data[otherUserIdInDM] : null;
                return { ...ch, otherParticipant: otherParticipantInfo }; // Add otherParticipant to the channel object
            });

            return channelsWithParticipantInfo;

        } catch (err) {
            console.error('Error fetching DM channels:', err);
            setError(err.message || 'Failed to fetch DM channels');
            return [];
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id]);

    const getOtherParticipant = useCallback((dmChannel) => {
        const currentUserId = currentUser?.id;
        // Ensure participants_data exists and currentUserId is valid
        if (!dmChannel?.participants_data || !currentUserId || typeof dmChannel.participants_data !== 'object') {
            return null;
        }
        // Find the user ID in participants_data that is not the current user
        const otherUserId = Object.keys(dmChannel.participants_data).find(
            userId => userId !== currentUserId
        );
        return otherUserId ? dmChannel.participants_data[otherUserId] : null;
    }, [currentUser?.id]);

    const isDMChannel = useCallback((channel) => {
        return channel?.is_dm === true || channel?.type === 'direct-message';
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