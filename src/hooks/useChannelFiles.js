import { useState, useEffect, useCallback } from 'react';
import { 
    collection, 
    query, 
    where,
    orderBy, 
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const useChannelFiles = (channelId) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { currentUser, userProfile } = useAuth();

    // Use getDocs instead of onSnapshot to reduce Firestore load
    const fetchChannelFiles = useCallback(async () => {
        if (!channelId) {
            setFiles([]);
            return;
        }

        setLoading(true);
        
        try {
            // Query files in the channel by looking at messages with attachments
            const messagesQuery = query(
                collection(db, 'channels', channelId, 'messages'),
                where('attachments', '!=', null),
                orderBy('createdAt', 'desc'),
                limit(200) // Reasonable limit for performance
            );

            const snapshot = await getDocs(messagesQuery);
            const allFiles = [];
            
            snapshot.docs.forEach((doc) => {
                const messageData = doc.data();
                if (messageData.attachments && Array.isArray(messageData.attachments)) {
                    messageData.attachments.forEach((attachment, index) => {
                        allFiles.push({
                            id: `${doc.id}_${index}`, // Unique ID for each file
                            messageId: doc.id,
                            ...attachment,
                            uploadedAt: messageData.createdAt,
                            uploadedBy: messageData.author,
                            channelId: channelId
                        });
                    });
                }
            });
            
            setFiles(allFiles);
            setError(null);
        } catch (err) {
            console.error('Error fetching channel files:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [channelId]);

    // Load channel files on mount and when channelId changes
    useEffect(() => {
        fetchChannelFiles();
    }, [fetchChannelFiles]);

    // Get channel files (main function)
    const getChannelFiles = useCallback(async () => {
        // This is handled by the useEffect above
        // This function exists for consistency with the API
        return files;
    }, [files]);

    // Search files by name or type
    const searchFiles = useCallback((searchQuery) => {
        if (!searchQuery) return files;

        const query = searchQuery.toLowerCase();
        return files.filter(file => 
            file.name?.toLowerCase().includes(query) ||
            file.type?.toLowerCase().includes(query) ||
            file.uploadedBy?.displayName?.toLowerCase().includes(query)
        );
    }, [files]);

    // Get files by type
    const getFilesByType = useCallback((fileType) => {
        if (!fileType || fileType === 'all') return files;

        return files.filter(file => {
            const type = file.type?.toLowerCase() || '';
            
            switch (fileType.toLowerCase()) {
                case 'image':
                    return type.startsWith('image/');
                case 'video':
                    return type.startsWith('video/');
                case 'audio':
                    return type.startsWith('audio/');
                case 'document':
                    return type.includes('pdf') || 
                           type.includes('document') || 
                           type.includes('text') ||
                           type.includes('msword') ||
                           type.includes('wordprocessingml') ||
                           type.includes('spreadsheet') ||
                           type.includes('presentationml');
                case 'archive':
                    return type.includes('zip') || 
                           type.includes('rar') || 
                           type.includes('tar') ||
                           type.includes('gzip') ||
                           type.includes('7z');
                default:
                    return type.includes(fileType.toLowerCase());
            }
        });
    }, [files]);

    // Download file
    const downloadFile = async (fileId) => {
        try {
            const file = files.find(f => f.id === fileId);
            if (!file) {
                throw new Error('File not found');
            }

            if (file.url) {
                // If direct URL is available, use it
                const link = document.createElement('a');
                link.href = file.url;
                link.download = file.name || 'download';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (file.storageRef) {
                // Get download URL from Firebase Storage
                const storage = getStorage();
                const fileRef = ref(storage, file.storageRef);
                const downloadURL = await getDownloadURL(fileRef);
                
                const link = document.createElement('a');
                link.href = downloadURL;
                link.download = file.name || 'download';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                throw new Error('File URL not available');
            }

            return { success: true, fileId };

        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    };

    // Check if user can delete file
    const canDeleteFile = useCallback(async (fileId) => {
        if (!currentUser || !fileId) return false;

        try {
            const file = files.find(f => f.id === fileId);
            if (!file) return false;

            // User can delete their own files
            if (file.uploadedBy?.id === currentUser.uid) return true;

            // Check if user is channel admin/moderator
            const channelDoc = await getDoc(doc(db, 'channels', channelId));
            if (channelDoc.exists()) {
                const channelData = channelDoc.data();
                if (channelData.admins?.includes(currentUser.uid) || 
                    channelData.moderators?.includes(currentUser.uid)) {
                    return true;
                }
            }

            // Check if user is system admin
            if (userProfile?.role === 'admin') return true;

            return false;

        } catch (error) {
            console.error('Error checking file deletion permissions:', error);
            return false;
        }
    }, [files, currentUser, userProfile, channelId]);

    // Delete file
    const deleteFile = async (fileId) => {
        if (!fileId || !currentUser) {
            throw new Error('Missing required parameters for file deletion');
        }

        try {
            const file = files.find(f => f.id === fileId);
            if (!file) {
                throw new Error('File not found');
            }

            // Check permissions
            const hasPermission = await canDeleteFile(fileId);
            if (!hasPermission) {
                throw new Error('You do not have permission to delete this file');
            }

            // Delete from Firebase Storage if storageRef exists
            if (file.storageRef) {
                try {
                    const storage = getStorage();
                    const fileRef = ref(storage, file.storageRef);
                    await deleteObject(fileRef);
                } catch (storageError) {
                    console.warn('Error deleting file from storage:', storageError);
                    // Continue with message update even if storage deletion fails
                }
            }

            // Remove attachment from the message
            const messageRef = doc(db, 'channels', channelId, 'messages', file.messageId);
            const messageDoc = await getDoc(messageRef);
            
            if (messageDoc.exists()) {
                const messageData = messageDoc.data();
                const updatedAttachments = messageData.attachments.filter(
                    (_, index) => `${file.messageId}_${index}` !== fileId
                );

                await updateDoc(messageRef, {
                    attachments: updatedAttachments,
                    updatedAt: serverTimestamp()
                });
            }

            return { success: true, fileId };

        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    };

    // Get file statistics
    const getFileStats = useCallback(() => {
        if (!files.length) return null;

        const stats = {
            total: files.length,
            totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
            byType: {},
            byUploader: {},
            recentUploads: files.filter(file => {
                const uploadDate = file.uploadedAt?.toDate?.() || new Date(file.uploadedAt);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return uploadDate > dayAgo;
            }).length
        };

        // Count by type
        files.forEach(file => {
            const type = file.type?.split('/')[0] || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        // Count by uploader
        files.forEach(file => {
            const uploader = file.uploadedBy?.displayName || 'Unknown';
            stats.byUploader[uploader] = (stats.byUploader[uploader] || 0) + 1;
        });

        return stats;
    }, [files]);

    // Get files uploaded by specific user
    const getFilesByUser = useCallback((userId) => {
        if (!userId) return [];
        
        return files.filter(file => file.uploadedBy?.id === userId);
    }, [files]);

    // Get files within date range
    const getFilesByDateRange = useCallback((startDate, endDate) => {
        if (!startDate || !endDate) return files;

        return files.filter(file => {
            const uploadDate = file.uploadedAt?.toDate?.() || new Date(file.uploadedAt);
            return uploadDate >= startDate && uploadDate <= endDate;
        });
    }, [files]);

    // Get large files (over specified size in bytes)
    const getLargeFiles = useCallback((sizeThreshold = 10 * 1024 * 1024) => { // Default 10MB
        return files.filter(file => (file.size || 0) > sizeThreshold);
    }, [files]);

    // Get duplicate files (same name and size)
    const getDuplicateFiles = useCallback(() => {
        const duplicates = [];
        const seen = new Map();

        files.forEach(file => {
            const key = `${file.name}_${file.size}`;
            if (seen.has(key)) {
                const existing = seen.get(key);
                if (!duplicates.find(group => group.includes(existing))) {
                    duplicates.push([existing, file]);
                } else {
                    const group = duplicates.find(group => group.includes(existing));
                    group.push(file);
                }
            } else {
                seen.set(key, file);
            }
        });

        return duplicates;
    }, [files]);

    // Export file list
    const exportFileList = useCallback(() => {
        const exportData = {
            exportedAt: new Date().toISOString(),
            channelId: channelId,
            totalFiles: files.length,
            files: files.map(file => ({
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: file.uploadedAt?.toDate?.() || file.uploadedAt,
                uploadedBy: file.uploadedBy?.displayName || 'Unknown',
                messageId: file.messageId
            }))
        };

        return exportData;
    }, [files, channelId]);

    // Bulk download files (creates a list for user to download individually)
    const prepareBulkDownload = useCallback((fileIds) => {
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            throw new Error('Invalid file IDs provided');
        }

        const selectedFiles = files.filter(file => fileIds.includes(file.id));
        
        return {
            files: selectedFiles,
            totalSize: selectedFiles.reduce((sum, file) => sum + (file.size || 0), 0),
            downloadUrls: selectedFiles.map(file => ({
                id: file.id,
                name: file.name,
                url: file.url || file.storageRef
            }))
        };
    }, [files]);

    return {
        // State
        files,
        loading,
        error,

        // Core operations
        getChannelFiles,
        downloadFile,
        deleteFile,
        canDeleteFile,

        // Search and filter operations
        searchFiles,
        getFilesByType,
        getFilesByUser,
        getFilesByDateRange,

        // Analysis operations
        getFileStats,
        getLargeFiles,
        getDuplicateFiles,

        // Utility operations
        exportFileList,
        prepareBulkDownload
    };
}; 