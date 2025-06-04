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
    serverTimestamp,
    deleteField
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const useCourses = (classId = null) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth();

    // Fetch courses - either all or for specific class
    const fetchCourses = useCallback(async () => {
        if (!currentUser?.uid) {
            setCourses([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            let q;
            if (classId) {
                // Get courses for specific class
                q = query(
                    collection(db, 'courses'),
                    where('classId', '==', classId),
                    orderBy('createdAt', 'desc')
                );
            } else {
                // Get all courses, ordered by creation date
                q = query(
                    collection(db, 'courses'),
                    orderBy('createdAt', 'desc')
                );
            }
            
            const snapshot = await getDocs(q);
            const coursesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            }));
            
            setCourses(coursesData);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    }, [currentUser?.uid, classId]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // Create a new course linked to a class
    const createCourse = async (courseData, classId, channelId = null) => {
        try {
            setError(null);
            
            const timestamp = serverTimestamp();
            const newCourse = {
                classId,
                channelId,
                courseName: courseData.courseName,
                sheetUrl: courseData.sheetUrl || '',
                teachers: courseData.teachers || [],
                level: courseData.level || '',
                beginDate: courseData.beginDate || '',
                endDate: courseData.endDate || '',
                days: courseData.days || [],
                totalDays: courseData.totalDays || '',
                status: 'active',
                createdAt: timestamp,
                updatedAt: timestamp,
                createdBy: currentUser.uid
            };
            
            const docRef = await addDoc(collection(db, 'courses'), newCourse);
            
            // Refresh courses list
            await fetchCourses();
            
            return { id: docRef.id, ...newCourse };
        } catch (err) {
            console.error('Error creating course:', err);
            setError(err.message);
            throw err;
        }
    };

    // Update an existing course
    const updateCourse = async (courseId, updates) => {
        try {
            setError(null);
            
            const courseRef = doc(db, 'courses', courseId);
            await updateDoc(courseRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            
            // Refresh courses list
            await fetchCourses();
        } catch (err) {
            console.error('Error updating course:', err);
            setError('Failed to update course');
            throw err;
        }
    };

    // Delete a course
    const deleteCourse = async (courseId) => {
        try {
            setError(null);
            
            // First, get the course data to access classId
            const courseRef = doc(db, 'courses', courseId);
            const courseDoc = await getDoc(courseRef);
            
            if (!courseDoc.exists()) {
                throw new Error('Course not found');
            }
            
            const courseData = courseDoc.data();
            const classId = courseData.classId;
            
            // Check how many courses exist for this class
            const classCoursesQuery = query(
                collection(db, 'courses'),
                where('classId', '==', classId)
            );
            const classCoursesSnapshot = await getDocs(classCoursesQuery);
            
            // Filter for active courses (including those without status field, which default to active)
            // and exclude the course being deleted
            const activeCourses = classCoursesSnapshot.docs.filter(doc => {
                const data = doc.data();
                const isActive = !data.status || data.status === 'active'; // Default to active if no status
                const isNotBeingDeleted = doc.id !== courseId;
                return isActive && isNotBeingDeleted;
            });
            
            // Delete the course
            await deleteDoc(courseRef);
            
            // If this was the last course for the class, clean up class fields
            if (activeCourses.length === 0 && classId) {
                console.log(`🧹 Last course deleted for class ${classId}, initiating automatic cleanup...`);
                
                const classRef = doc(db, 'classes', classId);
                const classDoc = await getDoc(classRef);
                
                if (classDoc.exists()) {
                    // Remove format, formatOption, classType, and days fields from the class
                    const updates = {
                        updatedAt: serverTimestamp()
                    };
                    
                    // Use FieldValue.delete() to remove fields, but since we can't import it here,
                    // we'll set them to null or empty values
                    const cleanupFields = {
                        format: deleteField(),
                        formatOption: deleteField(),
                        classType: deleteField(),
                        days: deleteField()
                    };
                    
                    await updateDoc(classRef, {
                        ...cleanupFields,
                        ...updates
                    });
                    
                    console.log('✅ Class fields cleaned up successfully:', {
                        classId,
                        courseName: courseData.courseName,
                        removedFields: ['format', 'formatOption', 'classType', 'days'],
                        message: 'Class is now ready for new courses'
                    });
                } else {
                    console.warn('⚠️ Class document not found for cleanup:', classId);
                }
            } else {
                console.log(`📚 Course deleted, ${activeCourses.length} active course(s) remaining for class ${classId}`);
            }
            
            // Refresh courses list
            await fetchCourses();
        } catch (err) {
            console.error('Error deleting course:', err);
            setError('Failed to delete course');
            throw err;
        }
    };

    // Archive a course
    const archiveCourse = async (courseId) => {
        try {
            setError(null);
            
            const courseRef = doc(db, 'courses', courseId);
            await updateDoc(courseRef, {
                status: 'archived',
                updatedAt: serverTimestamp()
            });
            
            // Refresh courses list
            await fetchCourses();
        } catch (err) {
            console.error('Error archiving course:', err);
            setError('Failed to archive course');
            throw err;
        }
    };

    // Get courses by class ID
    const getCoursesByClassId = useCallback(async (classId) => {
        try {
            const coursesQuery = query(
                collection(db, 'courses'),
                where('classId', '==', classId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(coursesQuery);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            }));
        } catch (err) {
            console.error('Error getting courses by class ID:', err);
            return [];
        }
    }, []);

    // Get courses by channel ID
    const getCoursesByChannelId = useCallback(async (channelId) => {
        try {
            const coursesQuery = query(
                collection(db, 'courses'),
                where('channelId', '==', channelId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(coursesQuery);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            }));
        } catch (err) {
            console.error('Error getting courses by channel ID:', err);
            return [];
        }
    }, []);

    // Query courses by various filters
    const queryCourses = async (filters = {}) => {
        try {
            let q = collection(db, 'courses');
            
            // Apply filters
            if (filters.teacher) {
                q = query(q, where('teachers', 'array-contains', filters.teacher));
            }
            if (filters.level) {
                q = query(q, where('level', '==', filters.level));
            }
            if (filters.status) {
                q = query(q, where('status', '==', filters.status));
            }
            if (filters.classId) {
                q = query(q, where('classId', '==', filters.classId));
            }
            if (filters.channelId) {
                q = query(q, where('channelId', '==', filters.channelId));
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
            console.error('Error querying courses:', err);
            throw err;
        }
    };

    return {
        courses,
        loading,
        error,
        createCourse,
        updateCourse,
        deleteCourse,
        archiveCourse,
        getCoursesByClassId,
        getCoursesByChannelId,
        queryCourses,
        refetch: fetchCourses
    };
}; 