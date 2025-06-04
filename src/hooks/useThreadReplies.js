import { useState, useEffect } from 'react';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';
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
        
        // Query replies for this message thread with a reasonable limit for performance
        // OPTIMIZATION: Reduced limit from 50 to 25 to minimize Firestore reads
        const repliesQuery = query(
            collection(db, 'channels', channelId, 'messages', messageId, 'replies'),
            orderBy('createdAt', 'asc'),
            limit(25) // Reduced for performance and quota management
        );

        const unsubscribe = onSnapshot(
            repliesQuery,
            (snapshot) => {
                const replyData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setReplies(replyData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching thread replies:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [channelId, messageId]);

    const sendReply = async (content) => {
        if (!channelId || !messageId || !currentUser || !content?.trim()) {
            return;
        }

        try {
            const replyData = {
                content: content.trim(),
                authorId: currentUser.uid,
                author: {
                    id: currentUser.uid,
                    displayName: userProfile?.displayName || userProfile?.fullName || currentUser.displayName,
                    email: currentUser.email,
                    avatar: userProfile?.photo || null
                },
                parentMessageId: messageId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // OPTIMIZATION: Add the reply (this is the only essential write)
            await addDoc(collection(db, 'channels', channelId, 'messages', messageId, 'replies'), replyData);

            // OPTIMIZATION: Significantly reduced metadata updates to minimize writes
            // Only update reply count every 5 replies to reduce write operations
            const currentReplyCount = replies.length + 1; // +1 for the reply we just added
            const shouldUpdateCount = currentReplyCount % 5 === 0 || currentReplyCount === 1;
            
            if (shouldUpdateCount) {
                const messageRef = doc(db, 'channels', channelId, 'messages', messageId);
                await updateDoc(messageRef, {
                    replyCount: increment(1),
                    // REMOVED: lastThreadActivity - not essential for functionality
                    // REMOVED: lastReply - not essential, can be computed from replies
                });
            }
            
            // Note: Reply count in UI will be calculated from actual replies array length
            // This ensures UI accuracy while reducing writes significantly

        } catch (error) {
            console.error('Error sending reply:', error);
            throw error;
        }
    };

    // Get unique thread participants
    const getThreadParticipants = () => {
        const participantMap = new Map();
        
        replies.forEach(reply => {
            if (reply.author) {
                participantMap.set(reply.author.id || reply.author.email, reply.author);
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