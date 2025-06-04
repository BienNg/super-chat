import { useState, useEffect, useCallback } from 'react';
import { 
    collection, 
    query, 
    where,
    orderBy, 
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const useBookmarks = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { currentUser, userProfile } = useAuth();

    // Temporarily disable real-time listener to reduce Firestore load
    useEffect(() => {
        if (!currentUser) {
            setBookmarks([]);
            return;
        }

        // Just set empty for now
        setBookmarks([]);
        setLoading(false);
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
                bookmark => bookmark.targetId === targetId && 
                           bookmark.type === type && 
                           bookmark.userId === currentUser.uid
            );

            if (existingBookmark) {
                throw new Error('This item is already bookmarked');
            }

            const bookmark = {
                userId: currentUser.uid,
                type, // 'message', 'file', 'link', 'task'
                targetId,
                channelId,
                title,
                description: bookmarkData.description || null,
                url: bookmarkData.url || null, // For link bookmarks
                metadata: bookmarkData.metadata || {}, // Additional data specific to bookmark type
                tags: bookmarkData.tags || [], // User-defined tags
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isPrivate: bookmarkData.isPrivate || false, // Private bookmarks only visible to user
                notes: bookmarkData.notes || null // User notes about the bookmark
            };

            const docRef = await addDoc(collection(db, 'bookmarks'), bookmark);
            
            return {
                success: true,
                bookmarkId: docRef.id,
                bookmark: { id: docRef.id, ...bookmark }
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

            if (bookmark.userId !== currentUser.uid) {
                throw new Error('You can only remove your own bookmarks');
            }

            await deleteDoc(doc(db, 'bookmarks', bookmarkId));
            
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

            if (bookmark.userId !== currentUser.uid) {
                throw new Error('You can only update your own bookmarks');
            }

            const allowedUpdates = ['notes', 'tags', 'isPrivate', 'title', 'description'];
            const filteredUpdates = Object.keys(updates)
                .filter(key => allowedUpdates.includes(key))
                .reduce((obj, key) => {
                    obj[key] = updates[key];
                    return obj;
                }, {});

            if (Object.keys(filteredUpdates).length === 0) {
                throw new Error('No valid updates provided');
            }

            filteredUpdates.updatedAt = serverTimestamp();

            await updateDoc(doc(db, 'bookmarks', bookmarkId), filteredUpdates);
            
            return { success: true, bookmarkId, updates: filteredUpdates };

        } catch (error) {
            console.error('Error updating bookmark:', error);
            throw error;
        }
    };

    // Check if an item is bookmarked
    const isBookmarked = useCallback((targetId, type) => {
        if (!currentUser || !targetId || !type) return false;
        
        return bookmarks.some(
            bookmark => bookmark.targetId === targetId && 
                       bookmark.type === type && 
                       bookmark.userId === currentUser.uid
        );
    }, [bookmarks, currentUser]);

    // Get bookmarks by channel
    const getBookmarksByChannel = useCallback(async (channelId) => {
        if (!channelId || !currentUser) return [];

        try {
            const channelBookmarks = bookmarks.filter(
                bookmark => bookmark.channelId === channelId
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
            filtered = filtered.filter(bookmark => bookmark.channelId === channelId);
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

            const successful = results.filter(result => result.status === 'fulfilled');
            const failed = results.filter(result => result.status === 'rejected');

            return {
                success: true,
                added: successful.length,
                failed: failed.length,
                errors: failed.map(result => result.reason.message)
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
                bookmarkIds.map(bookmarkId => removeBookmark(bookmarkId))
            );

            const successful = results.filter(result => result.status === 'fulfilled');
            const failed = results.filter(result => result.status === 'rejected');

            return {
                success: true,
                removed: successful.length,
                failed: failed.length,
                errors: failed.map(result => result.reason.message)
            };

        } catch (error) {
            console.error('Error removing multiple bookmarks:', error);
            throw error;
        }
    };

    // Export bookmarks (for backup/sharing)
    const exportBookmarks = useCallback((channelId = null) => {
        let exportData = bookmarks;
        
        if (channelId) {
            exportData = bookmarks.filter(bookmark => bookmark.channelId === channelId);
        }

        const exportObject = {
            exportedAt: new Date().toISOString(),
            userId: currentUser?.uid,
            channelId: channelId || 'all',
            bookmarks: exportData.map(bookmark => ({
                ...bookmark,
                // Remove Firestore-specific fields
                createdAt: bookmark.createdAt?.toDate?.() || bookmark.createdAt,
                updatedAt: bookmark.updatedAt?.toDate?.() || bookmark.updatedAt
            }))
        };

        return exportObject;
    }, [bookmarks, currentUser]);

    // Get bookmark statistics
    const getBookmarkStats = useCallback(() => {
        if (!currentUser) return null;

        const stats = {
            total: bookmarks.length,
            byType: {},
            byChannel: {},
            withTags: bookmarks.filter(b => b.tags && b.tags.length > 0).length,
            private: bookmarks.filter(b => b.isPrivate).length
        };

        // Count by type
        bookmarks.forEach(bookmark => {
            stats.byType[bookmark.type] = (stats.byType[bookmark.type] || 0) + 1;
        });

        // Count by channel
        bookmarks.forEach(bookmark => {
            stats.byChannel[bookmark.channelId] = (stats.byChannel[bookmark.channelId] || 0) + 1;
        });

        return stats;
    }, [bookmarks, currentUser]);

    return {
        // State
        bookmarks,
        loading,
        error,

        // Core operations
        addBookmark,
        removeBookmark,
        updateBookmark,
        isBookmarked,

        // Query operations
        getBookmarksByChannel,
        getBookmarksByType,
        searchBookmarks,
        getBookmarksWithTags,
        getAllTags,

        // Bulk operations
        addMultipleBookmarks,
        removeMultipleBookmarks,

        // Utility operations
        exportBookmarks,
        getBookmarkStats
    };
}; 