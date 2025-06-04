import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook for managing tasks in a channel with unified threading system
 */
export const useTasks = (channelId) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        if (!channelId) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        
        // Initial fetch of tasks in the channel
        const fetchTasks = async () => {
            try {
                const { data, error: fetchError } = await supabase
                    .from('channel_tasks')
                    .select('*')
                    .eq('channel_id', channelId)
                    .order('last_activity', { ascending: false });
                
                if (fetchError) throw fetchError;
                
                setTasks(data || []);
                setLoading(false);
                setError(null);
            } catch (err) {
                console.error('Error fetching tasks:', err);
                setError(err.message);
                setLoading(false);
            }
        };
        
        fetchTasks();

        // Set up real-time subscription for tasks
        const tasksSubscription = supabase
            .channel(`channel-tasks-${channelId}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'channel_tasks',
                    filter: `channel_id=eq.${channelId}` 
                },
                (payload) => {
                    // Refresh tasks when there's a change
                    fetchTasks();
                }
            )
            .subscribe();

        return () => {
            // Ensure proper cleanup to prevent memory leaks
            supabase.removeChannel(tasksSubscription);
        };
    }, [channelId]);

    // Helper function to update task lastActivity
    const updateTaskLastActivity = async (taskId) => {
        try {
            const timestamp = new Date().toISOString();
            const { error: updateError } = await supabase
                .from('channel_tasks')
                .update({ last_activity: timestamp })
                .eq('id', taskId);
            
            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating task lastActivity:', err);
        }
    };

    const createTaskFromMessage = async (messageId, messageData) => {
        if (!currentUser || !channelId) {
            throw new Error('User not authenticated or channel not selected');
        }

        try {
            setLoading(true);
            
            const timestamp = new Date().toISOString();
            
            // Extract sender information with proper fallbacks
            const senderId = messageData.author?.id || messageData.author_id || currentUser.id;
            const senderDisplayName = messageData.author?.display_name || messageData.author?.email || userProfile.display_name || currentUser.email;
            const senderEmail = messageData.author?.email || currentUser.email;
            
            // Create task data
            const taskData = {
                channel_id: channelId,
                source_message_id: messageId,
                source_message_data: {
                    content: messageData.content,
                    sender: {
                        user_id: senderId,
                        display_name: senderDisplayName,
                        email: senderEmail,
                        avatar: messageData.author?.avatar || senderDisplayName?.charAt(0) || 'U',
                        avatar_color: messageData.author?.avatar_color || 'bg-indigo-500'
                    },
                    timestamp: messageData.timestamp || messageData.created_at,
                    reply_count: messageData.reply_count || 0
                },
                participants: [
                    {
                        user_id: currentUser.id,
                        display_name: userProfile?.display_name || currentUser.email,
                        added_at: timestamp,
                        added_by: 'creator'
                    }
                ],
                created_at: timestamp,
                created_by: currentUser.id,
                last_activity: timestamp,
                status: 'active'
            };
            
            // Create the task in the database
            const { data: newTask, error: taskError } = await supabase
                .from('channel_tasks')
                .insert(taskData)
                .select()
                .single();
            
            if (taskError) throw taskError;
            
            // Update the source message to mark it as a task
            const { error: messageError } = await supabase
                .from('messages')
                .update({
                    task_id: newTask.id,
                    is_task: true,
                    updated_at: timestamp
                })
                .eq('id', messageId);
            
            if (messageError) throw messageError;
            
            return { success: true, taskId: newTask.id };
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateTaskParticipants = async (taskId, participants) => {
        try {
            const timestamp = new Date().toISOString();
            const { error: updateError } = await supabase
                .from('channel_tasks')
                .update({
                    participants,
                    last_activity: timestamp
                })
                .eq('id', taskId);
            
            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error updating task participants:', err);
            setError(err.message);
            throw err;
        }
    };

    const markTaskComplete = async (taskId) => {
        try {
            const timestamp = new Date().toISOString();
            const { error: updateError } = await supabase
                .from('channel_tasks')
                .update({
                    status: 'completed',
                    completed_at: timestamp,
                    completed_by: currentUser.id,
                    last_activity: timestamp
                })
                .eq('id', taskId);
            
            if (updateError) throw updateError;
        } catch (err) {
            console.error('Error marking task complete:', err);
            setError(err.message);
            throw err;
        }
    };

    const deleteTask = async (taskId) => {
        try {
            // Get task to find source message
            const { data: task, error: taskFetchError } = await supabase
                .from('channel_tasks')
                .select('source_message_id')
                .eq('id', taskId)
                .single();
            
            if (taskFetchError && taskFetchError.code !== 'PGRST116') throw taskFetchError;
            
            if (task && task.source_message_id) {
                // Remove task reference from source message
                const { error: messageError } = await supabase
                    .from('messages')
                    .update({
                        task_id: null,
                        is_task: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', task.source_message_id);
                
                if (messageError) throw messageError;
            }
            
            // Delete the task
            const { error: deleteError } = await supabase
                .from('channel_tasks')
                .delete()
                .eq('id', taskId);
            
            if (deleteError) throw deleteError;
        } catch (err) {
            console.error('Error deleting task:', err);
            setError(err.message);
            throw err;
        }
    };

    // Note: Task replies now use the unified threading system via useThreadReplies
    // This ensures task conversations and message threads are exactly the same data

    return {
        tasks,
        loading,
        error,
        createTaskFromMessage,
        updateTaskParticipants,
        markTaskComplete,
        deleteTask,
        updateTaskLastActivity
    };
}; 