import { useState, useEffect, useCallback } from 'react';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    getDoc,
    getDocs,
    serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const useClasses = (channelId = null) => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth();

    // Fetch classes - either all or for specific channel
    const fetchClasses = useCallback(async () => {
        if (!currentUser?.uid) {
            setClasses([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            let q;
            if (channelId) {
                // Get class for specific channel
                q = query(
                    collection(db, 'classes'),
                    where('channelId', '==', channelId)
                );
            } else {
                // Get all classes, ordered by creation date
                q = query(
                    collection(db, 'classes'),
                    orderBy('createdAt', 'desc')
                );
            }
            
            const snapshot = await getDocs(q);
            const classesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            }));
            
            setClasses(classesData);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError('Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    }, [currentUser?.uid, channelId]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // Create a new class linked to a channel
    const createClass = async (classData, channelId) => {
        try {
            setError(null);
            
            // Check if channel already has a class
            const existingClassQuery = query(
                collection(db, 'classes'),
                where('channelId', '==', channelId)
            );
            const existingSnapshot = await getDocs(existingClassQuery);
            
            if (!existingSnapshot.empty) {
                throw new Error('This channel already has a class linked to it');
            }
            
            const timestamp = serverTimestamp();
            const newClass = {
                channelId,
                className: classData.className,
                classType: classData.type,
                createdAt: timestamp,
                updatedAt: timestamp,
                createdBy: currentUser.uid
            };

            // Only add fields that are explicitly provided
            if (classData.format !== undefined) {
                newClass.format = classData.format;
            }
            if (classData.sheetUrl !== undefined) {
                newClass.googleDriveUrl = classData.sheetUrl;
            }
            if (classData.teachers !== undefined) {
                newClass.teachers = classData.teachers;
            }
            if (classData.level !== undefined) {
                newClass.level = classData.level;
            }
            if (classData.beginDate !== undefined) {
                newClass.beginDate = classData.beginDate;
            }
            if (classData.endDate !== undefined) {
                newClass.endDate = classData.endDate;
            }
            if (classData.days !== undefined) {
                newClass.days = classData.days;
            }
            if (classData.status !== undefined) {
                newClass.status = classData.status;
            }
            
            const docRef = await addDoc(collection(db, 'classes'), newClass);
            
            // Refresh classes list
            await fetchClasses();
            
            return { id: docRef.id, ...newClass };
        } catch (err) {
            console.error('Error creating class:', err);
            setError(err.message);
            throw err;
        }
    };

    // Update an existing class
    const updateClass = async (classId, updates) => {
        try {
            setError(null);
            
            const classRef = doc(db, 'classes', classId);
            await updateDoc(classRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            
            // Refresh classes list
            await fetchClasses();
        } catch (err) {
            console.error('Error updating class:', err);
            setError('Failed to update class');
            throw err;
        }
    };

    // Archive a class (when channel type changes away from 'class')
    const archiveClass = async (channelId) => {
        try {
            setError(null);
            
            const classQuery = query(
                collection(db, 'classes'),
                where('channelId', '==', channelId)
            );
            const snapshot = await getDocs(classQuery);
            
            if (!snapshot.empty) {
                const classDoc = snapshot.docs[0];
                await updateDoc(doc(db, 'classes', classDoc.id), {
                    status: 'archived',
                    updatedAt: serverTimestamp()
                });
                
                // Refresh classes list
                await fetchClasses();
            }
        } catch (err) {
            console.error('Error archiving class:', err);
            setError('Failed to archive class');
            throw err;
        }
    };

    // Get class by channel ID
    const getClassByChannelId = async (channelId) => {
        if (!channelId) {
            return null;
        }

        try {
            const classesRef = collection(db, 'classes');
            const q = query(classesRef, where('channelId', '==', channelId));
            
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const classDoc = snapshot.docs[0];
                const classData = { id: classDoc.id, ...classDoc.data() };
                return classData;
            }

            return null;
        } catch (error) {
            console.error('Error fetching class by channelId:', error);
            return null;
        }
    };

    // Query classes by various filters
    const queryClasses = async (filters = {}) => {
        try {
            let q = collection(db, 'classes');
            
            // Apply filters
            if (filters.teacher) {
                q = query(q, where('teachers', 'array-contains', filters.teacher));
            }
            if (filters.level) {
                q = query(q, where('level', '==', filters.level));
            }
            if (filters.classType) {
                q = query(q, where('classType', '==', filters.classType));
            }
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            
            // Always order by creation date
            q = query(q, orderBy('createdAt', 'desc'));
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            }));
        } catch (err) {
            console.error('Error querying classes:', err);
            throw err;
        }
    };

    return {
        classes,
        loading,
        error,
        createClass,
        updateClass,
        archiveClass,
        getClassByChannelId,
        queryClasses,
        refetch: fetchClasses
    };
}; 