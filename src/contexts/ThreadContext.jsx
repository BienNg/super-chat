import React, { createContext, useContext, useState, useCallback } from 'react';

const ThreadContext = createContext();

export const useThread = () => {
    const context = useContext(ThreadContext);
    if (!context) {
        throw new Error('useThread must be used within a ThreadProvider');
    }
    return context;
};

export const ThreadProvider = ({ children }) => {
    // Store open threads by channel
    const [openThreads, setOpenThreads] = useState({});
    // Store thread data cache
    const [threadCache, setThreadCache] = useState({});
    // Track which thread is currently active
    const [activeThread, setActiveThread] = useState(null);

    // Open a thread in a specific channel
    const openThread = useCallback((channelId, messageId, messageData = null) => {
        const threadKey = `${channelId}-${messageId}`;
        
        setOpenThreads(prev => ({
            ...prev,
            [channelId]: messageId
        }));

        if (messageData) {
            setThreadCache(prev => ({
                ...prev,
                [threadKey]: messageData
            }));
        }

        setActiveThread({ channelId, messageId, threadKey });
    }, []);

    // Close thread in a specific channel
    const closeThread = useCallback((channelId) => {
        setOpenThreads(prev => {
            const newOpenThreads = { ...prev };
            delete newOpenThreads[channelId];
            return newOpenThreads;
        });

        // Clear active thread if it's the one being closed
        setActiveThread(prev => {
            if (prev && prev.channelId === channelId) {
                return null;
            }
            return prev;
        });
    }, []);

    // Get the open thread for a specific channel
    const getOpenThread = useCallback((channelId) => {
        const messageId = openThreads[channelId];
        if (!messageId) return null;

        const threadKey = `${channelId}-${messageId}`;
        return {
            messageId,
            threadKey,
            data: threadCache[threadKey] || null
        };
    }, [openThreads, threadCache]);

    // Update thread data in cache
    const updateThreadData = useCallback((channelId, messageId, data) => {
        const threadKey = `${channelId}-${messageId}`;
        setThreadCache(prev => ({
            ...prev,
            [threadKey]: { ...prev[threadKey], ...data }
        }));
    }, []);

    // Check if a thread is open in any channel
    const isThreadOpen = useCallback((channelId, messageId) => {
        return openThreads[channelId] === messageId;
    }, [openThreads]);

    // Get all open threads (for debugging or management)
    const getAllOpenThreads = useCallback(() => {
        return Object.entries(openThreads).map(([channelId, messageId]) => ({
            channelId,
            messageId,
            threadKey: `${channelId}-${messageId}`,
            data: threadCache[`${channelId}-${messageId}`] || null
        }));
    }, [openThreads, threadCache]);

    // Switch to a different channel while preserving thread state
    const switchChannel = useCallback((newChannelId) => {
        const openThread = getOpenThread(newChannelId);
        if (openThread) {
            setActiveThread({
                channelId: newChannelId,
                messageId: openThread.messageId,
                threadKey: openThread.threadKey
            });
        } else {
            setActiveThread(null);
        }
    }, [getOpenThread]);

    const value = {
        // State
        openThreads,
        threadCache,
        activeThread,
        
        // Actions
        openThread,
        closeThread,
        getOpenThread,
        updateThreadData,
        isThreadOpen,
        getAllOpenThreads,
        switchChannel
    };

    return (
        <ThreadContext.Provider value={value}>
            {children}
        </ThreadContext.Provider>
    );
}; 