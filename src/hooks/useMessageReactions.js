import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client
import { useAuth } from '../contexts/AuthContext';

export const useMessageReactions = (channelId) => {
  const [reactions, setReactions] = useState({}); // { messageId: [reactionObj, ...], ... }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, userProfile } = useAuth(); // userProfile is from Supabase 'profiles' table

  const getCurrentUserData = useCallback(() => {
    if (!currentUser) return null;
    return {
      id: currentUser.id, // Supabase user ID
      display_name: userProfile?.display_name || currentUser.email?.split('@')[0] || 'Unknown User',
      email: currentUser.email,
      avatar_url: userProfile?.avatar_url || null // Assuming avatar_url from profiles
    };
  }, [currentUser, userProfile]);

  const processFetchedReactions = (fetchedData) => {
    const newReactionsState = {};
    (fetchedData || []).forEach(reaction => {
      if (!newReactionsState[reaction.message_id]) {
        newReactionsState[reaction.message_id] = [];
      }
      newReactionsState[reaction.message_id].push({
        id: reaction.id,
        userId: reaction.user_id,
        user: reaction.user_data || { id: reaction.user_id, display_name: 'Loading...' }, // Fallback for user_data
        emoji: reaction.emoji,
        createdAt: reaction.created_at
      });
    });
    setReactions(newReactionsState);
  };

  const fetchReactionsForChannel = useCallback(async () => {
    if (!channelId || !currentUser?.id) {
      setReactions({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('reactions')
        .select('*')
        .eq('channel_id', channelId);

      if (fetchError) throw fetchError;
      processFetchedReactions(data);
    } catch (err) {
      console.error('Error fetching reactions:', err);
      setError(err.message);
      setReactions({});
    } finally {
      setLoading(false);
    }
  }, [channelId, currentUser?.id]);

  useEffect(() => {
    fetchReactionsForChannel();

    if (!channelId || !currentUser?.id) return;

    const reactionSubscription = supabase
      .channel(`reactions-channel-${channelId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reactions', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          // console.log('Reaction change received:', payload);
          // Could optimize by updating based on payload type (INSERT, DELETE)
          // For now, refetch all for simplicity and to ensure consistency
          fetchReactionsForChannel();
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Subscription error for reactions-channel-${channelId}:`, err);
          setError(`Realtime reactions subscription failed: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(reactionSubscription);
    };
  }, [channelId, currentUser?.id, fetchReactionsForChannel]);

  const addReaction = useCallback(async (messageId, emoji) => {
    const currentUserId = currentUser?.id;
    if (!currentUserId || !channelId || !messageId || !emoji) return;

    setLoading(true);
    try {
      // Check if user already reacted with this emoji on this message
      const { data: existingReaction, error: checkError } = await supabase
        .from('reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingReaction) return; // Already reacted

      const reactionData = {
        message_id: messageId,
        channel_id: channelId,
        user_id: currentUserId,
        user_data: getCurrentUserData(), // Store denormalized user data
        emoji,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('reactions').insert(reactionData);
      if (insertError) throw insertError;
      // Real-time listener should update the UI, or call fetchReactionsForChannel for optimistic update.
    } catch (error) {
      console.error('Error adding reaction:', error);
      setError('Failed to add reaction: ' + error.message);
      // Re-throw for component to potentially handle
      throw error;
    } finally {
      setLoading(false);
    }
  }, [channelId, currentUser, getCurrentUserData]);

  const removeReaction = useCallback(async (messageId, emoji) => {
    const currentUserId = currentUser?.id;
    if (!currentUserId || !channelId || !messageId || !emoji) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji);

      if (deleteError) throw deleteError;
      // Real-time listener should update the UI
    } catch (error) {
      console.error('Error removing reaction:', error);
      setError('Failed to remove reaction: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [channelId, currentUser]);

  const toggleReaction = useCallback(async (messageId, emoji) => {
    const currentUserId = currentUser?.id;
    if (!currentUserId || !channelId || !messageId || !emoji) {
      console.warn('Missing required parameters for toggleReaction');
      return;
    }

    // Optimistic update based on local state for immediate UI feedback
    const messageReactionsList = reactions[messageId] || [];
    const existingLocalReaction = messageReactionsList.find(
      r => r.userId === currentUserId && r.emoji === emoji
    );

    // For robustness, one might re-fetch the specific reaction or check DB state here
    // before deciding to add/remove, to avoid race conditions if local state is stale.
    // However, for simplicity and optimistic UI, this local check is often done.

    try {
      if (existingLocalReaction) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
      }
    } catch (err) {
      // Error already logged by addReaction/removeReaction
      // UI might need to revert optimistic update if one was performed
    }
  }, [reactions, currentUser, channelId, addReaction, removeReaction]);

  const getMessageReactions = useCallback((messageId) => {
    return reactions[messageId] || [];
  }, [reactions]);

  const getReactionSummary = useCallback((messageId) => {
    const messageReactionsList = reactions[messageId] || [];
    const summary = {};
    
    messageReactionsList.forEach(reaction => {
      const { emoji, userId, user } = reaction;
      if (!summary[emoji]) {
        summary[emoji] = {
          emoji,
          count: 0,
          users: [], // Store full user objects
          userIds: new Set(), // To track unique users for a given emoji
          hasCurrentUser: false
        };
      }
      if (!summary[emoji].userIds.has(userId)) {
        summary[emoji].count++;
        summary[emoji].users.push(user || { id: userId, display_name: 'Unknown'}); // Ensure user object exists
        summary[emoji].userIds.add(userId);
        if (userId === currentUser?.id) {
          summary[emoji].hasCurrentUser = true;
        }
      }
    });
    return Object.values(summary).map(({ userIds, ...rest }) => rest); // Remove internal userIds set
  }, [reactions, currentUser?.id]);

  const hasUserReacted = useCallback((messageId, emoji) => {
    const currentUserId = currentUser?.id;
    if (!currentUserId) return false;
    const messageReactionsList = reactions[messageId] || [];
    return messageReactionsList.some(
      r => r.userId === currentUserId && r.emoji === emoji
    );
  }, [reactions, currentUser?.id]);

  const getReactionCount = useCallback((messageId) => {
    const messageReactionsList = reactions[messageId] || [];
    return messageReactionsList.length;
  }, [reactions]);

  const cleanupReactionsForMessage = useCallback(async (messageId) => {
    if (!channelId || !messageId) return;
    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('message_id', messageId)
        // .eq('channel_id', channelId); // Optional: if message_id isn't globally unique or for added safety
      if (error) throw error;
    } catch (err) {
      console.error('Error cleaning up reactions:', err);
      // Do not throw, as this is a cleanup utility
    }
  }, [channelId]);

  return {
    reactions,
    loading,
    error,
    currentUserData: getCurrentUserData(), // Expose current user data snapshot
    addReaction,
    removeReaction,
    toggleReaction,
    getMessageReactions,
    getReactionSummary,
    hasUserReacted,
    getReactionCount,
    cleanupReactionsForMessage
  };
}; 