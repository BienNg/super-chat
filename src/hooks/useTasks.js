import { useState, useEffect } from 'react';
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp,
    getDoc,
    writeBatch,
    setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
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
        
        // Real-time listener for tasks in the channel
        const tasksRef = collection(db, 'channels', channelId, 'tasks');
        const tasksQuery = query(tasksRef, orderBy('lastActivity', 'desc'));
        
        const unsubscribe = onSnapshot(tasksQuery, 
            (snapshot) => {
                const tasksData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTasks(tasksData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching tasks:', err);
                setError(err);
                setLoading(false);
            }
        );

        return () => {
            // Ensure proper cleanup to prevent memory leaks
            unsubscribe();
        };
    }, [channelId]);

    // Helper function to update task lastActivity
    const updateTaskLastActivity = async (taskId) => {
        try {
            const taskRef = doc(db, 'channels', channelId, 'tasks', taskId);
            await updateDoc(taskRef, {
                lastActivity: serverTimestamp()
            });
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
            
            const batch = writeBatch(db);
            
            // Create task document
            const taskRef = doc(collection(db, 'channels', channelId, 'tasks'));
            
            // Extract sender information with proper fallbacks
            const senderId = messageData.author?.id || messageData.authorId || currentUser.uid;
            const senderDisplayName = messageData.author?.displayName || messageData.author?.email || currentUser.displayName || currentUser.email;
            const senderEmail = messageData.author?.email || currentUser.email;
            
            const taskData = {
                id: taskRef.id,
                sourceMessageId: messageId,
                sourceMessageData: {
                    content: messageData.content,
                    sender: {
                        userId: senderId,
                        displayName: senderDisplayName,
                        email: senderEmail,
                        avatar: messageData.author?.avatar || senderDisplayName?.charAt(0) || 'U',
                        avatarColor: messageData.author?.avatarColor || 'bg-indigo-500'
                    },
                    timestamp: messageData.timestamp || messageData.createdAt,
                    replyCount: messageData.replyCount || 0
                },
                participants: [
                    {
                        userId: currentUser.uid,
                        displayName: userProfile?.fullName || currentUser.displayName || currentUser.email,
                        addedAt: new Date(),
                        addedBy: 'creator'
                    }
                ],
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                lastActivity: serverTimestamp(),
                status: 'active'
            };
            
            batch.set(taskRef, taskData);
            
            // Update the source message to mark it as a task
            const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
            batch.update(messageRef, {
                taskId: taskRef.id,
                isTask: true
            });
            
            await batch.commit();
            
            return { success: true, taskId: taskRef.id };
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    };

    const updateTaskParticipants = async (taskId, participants) => {
        try {
            const taskRef = doc(db, 'channels', channelId, 'tasks', taskId);
            await updateDoc(taskRef, {
                participants,
                lastActivity: serverTimestamp()
            });
        } catch (err) {
            console.error('Error updating task participants:', err);
            setError(err);
            throw err;
        }
    };

    const markTaskComplete = async (taskId) => {
        try {
            const taskRef = doc(db, 'channels', channelId, 'tasks', taskId);
            await updateDoc(taskRef, {
                status: 'completed',
                completedAt: serverTimestamp(),
                completedBy: currentUser.uid,
                lastActivity: serverTimestamp()
            });
        } catch (err) {
            console.error('Error marking task complete:', err);
            setError(err);
            throw err;
        }
    };

    const deleteTask = async (taskId) => {
        try {
            const batch = writeBatch(db);
            
            // Get task to find source message
            const taskRef = doc(db, 'channels', channelId, 'tasks', taskId);
            const taskDoc = await getDoc(taskRef);
            
            if (taskDoc.exists()) {
                const taskData = taskDoc.data();
                
                // Remove task reference from source message
                if (taskData.sourceMessageId) {
                    const messageRef = doc(db, 'channels', channelId, 'messages', taskData.sourceMessageId);
                    batch.update(messageRef, {
                        taskId: null,
                        isTask: false
                    });
                }
                
                // Delete the task
                batch.delete(taskRef);
                
                await batch.commit();
            }
        } catch (err) {
            console.error('Error deleting task:', err);
            setError(err);
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