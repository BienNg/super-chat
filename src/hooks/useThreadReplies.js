import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useThreadReplies = (channelId, messageId) => {
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        if (!channelId || !messageId) {
            setReplies([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        
        // Initial fetch of replies
        const fetchReplies = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('message_replies')
                    .select('*')
                    .eq('parent_message_id', messageId)
                    .order('created_at', { ascending: true })
                    .limit(25);
                
                if (fetchError) throw fetchError;
                
                setReplies(data || []);
                setLoading(false);
                setError(null);
            } catch (err) {
                console.error('Error fetching thread replies:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchReplies();
        
        // Set up real-time subscription
        const replySubscription = supabase
            .channel(`message-replies-${messageId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'message_replies',
                    filter: `parent_message_id=eq.${messageId}`
                },
                (payload) => {
                    // Refresh the entire reply list when there's a change
                    fetchReplies();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(replySubscription);
        };
    }, [channelId, messageId]);

    const sendReply = async (content) => {
        if (!channelId || !messageId || !currentUser || !content?.trim()) {
            return;
        }

        try {
            const timestamp = new Date().toISOString();
            
            const replyData = {
                content: content.trim(),
                author_id: currentUser.id,
                user_data: {
                    id: currentUser.id,
                    display_name: userProfile?.display_name || currentUser.email?.split('@')[0],
                    email: currentUser.email,
                    avatar_url: userProfile?.avatar_url || null
                },
                parent_message_id: messageId,
                channel_id: channelId,
                created_at: timestamp,
                updated_at: timestamp
            };

            // Add the reply
            const { data: newReply, error: insertError } = await supabase
                .from('message_replies')
                .insert(replyData)
                .select()
                .single();
                
            if (insertError) throw insertError;

            // Only update reply count for the first reply or every 5 replies
            const currentReplyCount = replies.length + 1;
            const shouldUpdateCount = currentReplyCount % 5 === 0 || currentReplyCount === 1;
            
            if (shouldUpdateCount) {
                const { error: updateError } = await supabase
                    .from('messages')
                    .update({ 
                        reply_count: currentReplyCount,
                        updated_at: timestamp
                    })
                    .eq('id', messageId);
                
                if (updateError) console.warn('Error updating message reply count:', updateError);
            }
            
            return newReply;
        } catch (error) {
            console.error('Error sending reply:', error);
            throw error;
        }
    };

    // Get unique thread participants
    const getThreadParticipants = () => {
        const participantMap = new Map();
        
        replies.forEach(reply => {
            if (reply.user_data) {
                participantMap.set(reply.user_data.id || reply.user_data.email, reply.user_data);
            }
        });
        
        return Array.from(participantMap.values());
    };

    return {
        replies,
        loading,
        error,
        sendReply,
        participants: getThreadParticipants()
    };
}; 