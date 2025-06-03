import { useState, useEffect, useCallback, useRef } from 'react';

const DRAFT_STORAGE_KEY = 'chatter_message_drafts';
const DRAFT_EXPIRY_DAYS = 7; // Drafts expire after 7 days

export const useDrafts = () => {
    const [drafts, setDrafts] = useState({});

    // Load drafts from localStorage on mount
    useEffect(() => {
        try {
            const storedDrafts = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (storedDrafts) {
                const parsedDrafts = JSON.parse(storedDrafts);
                
                // Clean up expired drafts
                const now = Date.now();
                const validDrafts = {};
                
                Object.entries(parsedDrafts).forEach(([key, draft]) => {
                    const draftAge = now - draft.timestamp;
                    const maxAge = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
                    
                    if (draftAge < maxAge) {
                        validDrafts[key] = draft;
                    }
                });
                
                setDrafts(validDrafts);
                
                // Update localStorage with cleaned drafts
                if (Object.keys(validDrafts).length !== Object.keys(parsedDrafts).length) {
                    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(validDrafts));
                }
            }
        } catch (error) {
            console.error('Error loading drafts:', error);
            setDrafts({});
        }
    }, []);

    // Save drafts to localStorage with debouncing to prevent excessive writes
    const saveTimeoutRef = useRef(null);
    useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
            } catch (error) {
                console.error('Error saving drafts:', error);
            }
        }, 500); // Debounce localStorage writes

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [drafts]);

    // Generate draft key for channel or thread
    const getDraftKey = useCallback((channelId, threadId = null) => {
        return threadId ? `thread_${channelId}_${threadId}` : `channel_${channelId}`;
    }, []);

    // Get draft for specific channel or thread
    const getDraft = useCallback((channelId, threadId = null) => {
        const key = getDraftKey(channelId, threadId);
        return drafts[key] || null;
    }, [drafts, getDraftKey]);

    // Save draft for specific channel or thread
    const saveDraft = useCallback((channelId, content, attachments = [], threadId = null) => {
        const key = getDraftKey(channelId, threadId);
        
        // Don't save empty drafts
        if (!content?.trim() && (!attachments || attachments.length === 0)) {
            // Remove existing draft if content is empty
            setDrafts(prev => {
                const newDrafts = { ...prev };
                delete newDrafts[key];
                return newDrafts;
            });
            return;
        }

        const draft = {
            content: content?.trim() || '',
            attachments: attachments || [],
            timestamp: Date.now(),
            channelId,
            threadId
        };

        setDrafts(prev => ({
            ...prev,
            [key]: draft
        }));
    }, [getDraftKey]);

    // Clear draft for specific channel or thread
    const clearDraft = useCallback((channelId, threadId = null) => {
        const key = getDraftKey(channelId, threadId);
        setDrafts(prev => {
            const newDrafts = { ...prev };
            delete newDrafts[key];
            return newDrafts;
        });
    }, [getDraftKey]);

    // Get all drafts for a specific channel (including thread drafts)
    const getChannelDrafts = useCallback((channelId) => {
        const channelDrafts = {};
        Object.entries(drafts).forEach(([key, draft]) => {
            if (draft.channelId === channelId) {
                channelDrafts[key] = draft;
            }
        });
        return channelDrafts;
    }, [drafts]);

    // Clear all drafts for a specific channel
    const clearChannelDrafts = useCallback((channelId) => {
        setDrafts(prev => {
            const newDrafts = { ...prev };
            Object.keys(newDrafts).forEach(key => {
                if (newDrafts[key].channelId === channelId) {
                    delete newDrafts[key];
                }
            });
            return newDrafts;
        });
    }, []);

    // Clear all expired drafts
    const clearExpiredDrafts = useCallback(() => {
        const now = Date.now();
        const maxAge = DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        
        setDrafts(prev => {
            const newDrafts = {};
            Object.entries(prev).forEach(([key, draft]) => {
                const draftAge = now - draft.timestamp;
                if (draftAge < maxAge) {
                    newDrafts[key] = draft;
                }
            });
            return newDrafts;
        });
    }, []);

    // Get draft count for a channel (for UI indicators)
    const getDraftCount = useCallback((channelId) => {
        return Object.values(drafts).filter(draft => draft.channelId === channelId).length;
    }, [drafts]);

    // Check if there's a draft for specific location
    const hasDraft = useCallback((channelId, threadId = null) => {
        const draft = getDraft(channelId, threadId);
        return draft && (draft.content?.trim() || (draft.attachments && draft.attachments.length > 0));
    }, [getDraft]);

    // Auto-save draft with debouncing
    const autoSaveDraft = useCallback((channelId, content, attachments = [], threadId = null, delay = 1000) => {
        const timeoutId = setTimeout(() => {
            saveDraft(channelId, content, attachments, threadId);
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [saveDraft]);

    return {
        // Core functions
        getDraft,
        saveDraft,
        clearDraft,
        autoSaveDraft,
        
        // Channel-specific functions
        getChannelDrafts,
        clearChannelDrafts,
        getDraftCount,
        
        // Utility functions
        hasDraft,
        clearExpiredDrafts,
        
        // Raw data (for debugging)
        drafts
    };
}; 