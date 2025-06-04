// src/hooks/useChannelManagement.js (Updated with notifications and caching)
import { useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

export const useChannelManagement = () => {
    const [loading, setLoading] = useState(false);
    const usersCache = useRef(null);
    const lastFetchTime = useRef(0);
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

    const sendNotification = async (userId, type, channelId, channelName) => {
        try {
            const { error } = await supabase.from('notifications').insert({
                user_id: userId, // Assuming snake_case for Supabase
                type,
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
                channel_id: channelId,
                channel_name: channelName,
                read: false,
                created_at: new Date().toISOString()
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error sending notification:', error);
            // Do not re-throw, notification failure shouldn't block main operation
        }
    };

    const addMemberToChannel = async (channelId, userId, channelName = '') => {
        setLoading(true);
        try {
            const { data: channel, error: fetchError } = await supabase
                .from('channels')
                .select('members')
                .eq('id', channelId)
                .single();

            if (fetchError) throw fetchError;
            if (!channel) throw new Error('Channel not found');

            const currentMembers = channel.members || [];
            if (currentMembers.includes(userId)) {
                // console.log('User already a member');
                return; // Already a member
            }
            const updatedMembers = [...currentMembers, userId];

            const { error: updateError } = await supabase
                .from('channels')
                .update({ members: updatedMembers, updated_at: new Date().toISOString() })
                .eq('id', channelId);

            if (updateError) throw updateError;
            
            await sendNotification(userId, 'channel_added', channelId, channelName);
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeMemberFromChannel = async (channelId, userId, channelName = '') => {
        setLoading(true);
        try {
            const { data: channel, error: fetchError } = await supabase
                .from('channels')
                .select('members')
                .eq('id', channelId)
                .single();

            if (fetchError) throw fetchError;
            if (!channel) throw new Error('Channel not found');

            const currentMembers = channel.members || [];
            if (!currentMembers.includes(userId)) {
                // console.log('User not a member');
                return; // Not a member, nothing to remove
            }
            const updatedMembers = currentMembers.filter(memberId => memberId !== userId);

            const { error: updateError } = await supabase
                .from('channels')
                .update({ members: updatedMembers, updated_at: new Date().toISOString() })
                .eq('id', channelId);

            if (updateError) throw updateError;

            await sendNotification(userId, 'channel_removed', channelId, channelName);
        } catch (error) {
            console.error('Error removing member:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const bulkAddMembers = async (channelId, userIds, channelName = '') => {
        setLoading(true);
        try {
            const { data: channel, error: fetchError } = await supabase
                .from('channels')
                .select('members')
                .eq('id', channelId)
                .single();

            if (fetchError) throw fetchError;
            if (!channel) throw new Error('Channel not found');

            const currentMembers = channel.members || [];
            const newMembersToAdd = userIds.filter(id => !currentMembers.includes(id));
            if (newMembersToAdd.length === 0) return;

            const updatedMembers = [...currentMembers, ...newMembersToAdd];

            const { error: updateError } = await supabase
                .from('channels')
                .update({ members: updatedMembers, updated_at: new Date().toISOString() })
                .eq('id', channelId);

            if (updateError) throw updateError;
            
            const notificationPromises = newMembersToAdd.map((id) =>
                sendNotification(id, 'channel_added', channelId, channelName)
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
        setLoading(true);
        try {
            const { data: channel, error: fetchError } = await supabase
                .from('channels')
                .select('members')
                .eq('id', channelId)
                .single();

            if (fetchError) throw fetchError;
            if (!channel) throw new Error('Channel not found');

            const currentMembers = channel.members || [];
            const membersToRemove = userIds.filter(id => currentMembers.includes(id));
            if (membersToRemove.length === 0) return;

            const updatedMembers = currentMembers.filter(id => !userIds.includes(id));

            const { error: updateError } = await supabase
                .from('channels')
                .update({ members: updatedMembers, updated_at: new Date().toISOString() })
                .eq('id', channelId);

            if (updateError) throw updateError;
            
            const notificationPromises = membersToRemove.map((id) =>
                sendNotification(id, 'channel_removed', channelId, channelName)
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
        // Assuming user details are in a 'profiles' table, linked to auth.users by 'id'
        try {
            const currentTime = Date.now();
            if (usersCache.current && currentTime - lastFetchTime.current < CACHE_DURATION) {
                return usersCache.current;
            }

            const { data: users, error } = await supabase
                .from('profiles') // Changed from 'users' to 'profiles' as per convention
                .select('id, display_name, email, avatar_url'); // Select specific fields you need
            
            if (error) throw error;

            usersCache.current = users || [];
            lastFetchTime.current = currentTime;
            return users || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    };

    const deleteChannel = async (channelId, channelName = '') => {
        setLoading(true);
        try {
            const { data: channel, error: fetchError } = await supabase
                .from('channels')
                .select('members')
                .eq('id', channelId)
                .single();
            
            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // PGRST116 means not found, which is an error here
            if (!channel && !fetchError) throw new Error('Channel not found or no members data.'); // If data is null but no error

            // It's generally better to handle cascading deletes in DB with ON DELETE CASCADE
            // or within a database function (RPC) for atomicity.
            // Client-side sequential deletes can leave data in inconsistent state if one fails.

            // 1. Delete messages in the channel
            const { error: messagesError } = await supabase
                .from('messages')
                .delete()
                .eq('channel_id', channelId);
            
            if (messagesError) {
                console.warn('Error deleting messages in channel:', messagesError);
                // Decide if you want to proceed or throw error
            }

            // 2. Delete the channel document
            const { error: channelDeleteError } = await supabase
                .from('channels')
                .delete()
                .eq('id', channelId);

            if (channelDeleteError) throw channelDeleteError;

            // 3. Send notifications (if channel data was fetched successfully)
            if (channel && channel.members && channel.members.length > 0) {
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