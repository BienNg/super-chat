// ============= FIREBASE VERSION (BEFORE MIGRATION) =============
import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const FirebaseMessageList = ({ channelId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;

    const messagesRef = collection(db, 'channels', channelId, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [channelId]);

  return (
    <div className="message-list">
      {loading ? (
        <div>Loading messages...</div>
      ) : messages.length === 0 ? (
        <div>No messages yet</div>
      ) : (
        messages.map(message => (
          <div key={message.id} className="message-item">
            <div className="message-header">
              <span className="username">{message.userName}</span>
              <span className="timestamp">
                {message.createdAt?.toDate().toLocaleString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))
      )}
    </div>
  );
};

// ============= SUPABASE VERSION (AFTER MIGRATION) =============
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const SupabaseMessageList = ({ channelId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) return;

    // Initial fetch of messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, user_profiles(display_name)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel('messages-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Fetch the user profile for the new message
          const fetchUserProfile = async () => {
            const { data } = await supabase
              .from('user_profiles')
              .select('display_name')
              .eq('user_id', payload.new.user_id)
              .single();
              
            // Add the new message with user profile to the list
            setMessages(prev => [
              {
                ...payload.new,
                user_profiles: data
              },
              ...prev
            ]);
          };
          
          fetchUserProfile();
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => 
            prev.map(message => 
              message.id === payload.new.id ? { ...message, ...payload.new } : message
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => 
            prev.filter(message => message.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channelId]);

  return (
    <div className="message-list">
      {loading ? (
        <div>Loading messages...</div>
      ) : messages.length === 0 ? (
        <div>No messages yet</div>
      ) : (
        messages.map(message => (
          <div key={message.id} className="message-item">
            <div className="message-header">
              <span className="username">{message.user_profiles?.display_name}</span>
              <span className="timestamp">
                {new Date(message.created_at).toLocaleString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))
      )}
    </div>
  );
};

// Example usage
export { FirebaseMessageList, SupabaseMessageList }; 