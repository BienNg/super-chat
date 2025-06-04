import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useBookmarks = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { currentUser, userProfile } = useAuth();

    // Fetch bookmarks when user changes
    useEffect(() => {
        if (!currentUser) {
            setBookmarks([]);
            return;
        }

        const fetchBookmarks = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase
                    .from('bookmarks')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false });
                
                if (fetchError) throw fetchError;
                setBookmarks(data || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching bookmarks:', err);
                setError(err.message);
                setBookmarks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarks();

        // Set up real-time subscription
        const bookmarksSubscription = supabase
            .channel(`bookmarks-${currentUser.id}`)
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'bookmarks',
                    filter: `user_id=eq.${currentUser.id}`
                },
                (payload) => {
                    // Refresh bookmarks when there's a change
                    fetchBookmarks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(bookmarksSubscription);
        };
    }, [currentUser]);

    // Add a new bookmark
    const addBookmark = async (bookmarkData) => {
        if (!currentUser || !bookmarkData) {
            throw new Error('Missing required data for bookmark creation');
        }

        try {
            // Validate required fields
            const { type, targetId, channelId, title } = bookmarkData;
            if (!type || !targetId || !channelId || !title) {
                throw new Error('Missing required bookmark fields: type, targetId, channelId, title');
            }

            // Check if bookmark already exists
            const existingBookmark = bookmarks.find(
                bookmark => bookmark.target_id === targetId && 
                           bookmark.type === type && 
                           bookmark.user_id === currentUser.id
            );

            if (existingBookmark) {
                throw new Error('This item is already bookmarked');
            }

            const timestamp = new Date().toISOString();
            const bookmark = {
                user_id: currentUser.id,
                type, // 'message', 'file', 'link', 'task'
                target_id: targetId,
                channel_id: channelId,
                title,
                description: bookmarkData.description || null,
                url: bookmarkData.url || null, // For link bookmarks
                metadata: bookmarkData.metadata || {}, // Additional data specific to bookmark type
                tags: bookmarkData.tags || [], // User-defined tags
                created_at: timestamp,
                updated_at: timestamp,
                is_private: bookmarkData.isPrivate || false, // Private bookmarks only visible to user
                notes: bookmarkData.notes || null // User notes about the bookmark
            };

            const { data: newBookmark, error: insertError } = await supabase
                .from('bookmarks')
                .insert(bookmark)
                .select()
                .single();
            
            if (insertError) throw insertError;
            
            return {
                success: true,
                bookmarkId: newBookmark.id,
                bookmark: newBookmark
            };

        } catch (error) {
            console.error('Error adding bookmark:', error);
            throw error;
        }
    };

    // Remove a bookmark
    const removeBookmark = async (bookmarkId) => {
        if (!bookmarkId || !currentUser) {
            throw new Error('Missing required parameters for bookmark removal');
        }

        try {
            // Verify ownership
            const bookmark = bookmarks.find(b => b.id === bookmarkId);
            if (!bookmark) {
                throw new Error('Bookmark not found');
            }

            if (bookmark.user_id !== currentUser.id) {
                throw new Error('You can only remove your own bookmarks');
            }

            const { error: deleteError } = await supabase
                .from('bookmarks')
                .delete()
                .eq('id', bookmarkId);
            
            if (deleteError) throw deleteError;
            
            return { success: true, bookmarkId };

        } catch (error) {
            console.error('Error removing bookmark:', error);
            throw error;
        }
    };

    // Update bookmark (notes, tags, etc.)
    const updateBookmark = async (bookmarkId, updates) => {
        if (!bookmarkId || !currentUser || !updates) {
            throw new Error('Missing required parameters for bookmark update');
        }

        try {
            // Verify ownership
            const bookmark = bookmarks.find(b => b.id === bookmarkId);
            if (!bookmark) {
                throw new Error('Bookmark not found');
            }

            if (bookmark.user_id !== currentUser.id) {
                throw new Error('You can only update your own bookmarks');
            }

            const allowedUpdates = ['notes', 'tags', 'is_private', 'title', 'description'];
            const filteredUpdates = Object.keys(updates)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = updates[key];
                    return obj;
                }, {});

            if (Object.keys(filteredUpdates).length === 0) {
                throw new Error('No valid updates provided');
            }

            filteredUpdates.updated_at = new Date().toISOString();

            const { data: updatedBookmark, error: updateError } = await supabase
                .from('bookmarks')
                .update(filteredUpdates)
                .eq('id', bookmarkId)
                .select()
                .single();
            
            if (updateError) throw updateError;
            
            return { success: true, bookmarkId, updates: filteredUpdates, bookmark: updatedBookmark };

        } catch (error) {
            console.error('Error updating bookmark:', error);
            throw error;
        }
    };

    // Check if an item is bookmarked
    const isBookmarked = useCallback((targetId, type) => {
        if (!currentUser || !targetId || !type) return false;
        
        return bookmarks.some(
            bookmark => bookmark.target_id === targetId && 
                       bookmark.type === type && 
                       bookmark.user_id === currentUser.id
        );
    }, [bookmarks, currentUser]);

    // Get bookmarks by channel
    const getBookmarksByChannel = useCallback(async (channelId) => {
        if (!channelId || !currentUser) return [];

        try {
            const channelBookmarks = bookmarks.filter(
                bookmark => bookmark.channel_id === channelId
            );
            
            return channelBookmarks;
        } catch (error) {
            console.error('Error getting channel bookmarks:', error);
            return [];
        }
    }, [bookmarks, currentUser]);

    // Get bookmarks by type
    const getBookmarksByType = useCallback((type) => {
        if (!type || !currentUser) return [];
        
        return bookmarks.filter(bookmark => bookmark.type === type);
    }, [bookmarks, currentUser]);

    // Search bookmarks
    const searchBookmarks = useCallback((searchQuery, channelId = null) => {
        if (!searchQuery || !currentUser) return [];

        const query = searchQuery.toLowerCase();
        let filtered = bookmarks;

        // Filter by channel if specified
        if (channelId) {
            filtered = filtered.filter(bookmark => bookmark.channel_id === channelId);
        }

        // Search in title, description, notes, and tags
        return filtered.filter(bookmark => 
            bookmark.title?.toLowerCase().includes(query) ||
            bookmark.description?.toLowerCase().includes(query) ||
            bookmark.notes?.toLowerCase().includes(query) ||
            bookmark.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }, [bookmarks, currentUser]);

    // Get bookmarks with tags
    const getBookmarksWithTags = useCallback((tags) => {
        if (!tags || !Array.isArray(tags) || tags.length === 0 || !currentUser) return [];
        
        return bookmarks.filter(bookmark => 
            bookmark.tags && bookmark.tags.some(tag => tags.includes(tag))
        );
    }, [bookmarks, currentUser]);

    // Get all unique tags from user's bookmarks
    const getAllTags = useCallback(() => {
        if (!currentUser) return [];
        
        const allTags = bookmarks.reduce((tags, bookmark) => {
            if (bookmark.tags && Array.isArray(bookmark.tags)) {
                tags.push(...bookmark.tags);
            }
            return tags;
        }, []);
        
        // Return unique tags sorted alphabetically
        return [...new Set(allTags)].sort();
    }, [bookmarks, currentUser]);

    // Bulk operations
    const addMultipleBookmarks = async (bookmarksData) => {
        if (!Array.isArray(bookmarksData) || bookmarksData.length === 0) {
            throw new Error('Invalid bookmarks data provided');
        }

        try {
            const results = await Promise.allSettled(
                bookmarksData.map(bookmarkData => addBookmark(bookmarkData))
            );

            return {
                success: true,
                results: results,
                successful: results.filter(r => r.status === 'fulfilled').length,
                failed: results.filter(r => r.status === 'rejected').length
            };
        } catch (error) {
            console.error('Error adding multiple bookmarks:', error);
            throw error;
        }
    };

    const removeMultipleBookmarks = async (bookmarkIds) => {
        if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
            throw new Error('Invalid bookmark IDs provided');
        }

        try {
            const results = await Promise.allSettled(
                bookmarkIds.map(id => removeBookmark(id))
            );

            return {
                success: true,
                results: results,
                successful: results.filter(r => r.status === 'fulfilled').length,
                failed: results.filter(r => r.status === 'rejected').length
            };
        } catch (error) {
            console.error('Error removing multiple bookmarks:', error);
            throw error;
        }
    };

    return {
        bookmarks,
        loading,
        error,
        addBookmark,
        removeBookmark,
        updateBookmark,
        isBookmarked,
        getBookmarksByChannel,
        getBookmarksByType,
        searchBookmarks,
        getBookmarksWithTags,
        getAllTags,
        addMultipleBookmarks,
        removeMultipleBookmarks
    };
}; 