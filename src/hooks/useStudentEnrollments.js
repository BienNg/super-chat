import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const useStudentEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();

  // Fetch all enrollments from the new enrollments collection
  const fetchEnrollments = useCallback(async () => {
    if (!currentUser?.uid) {
      setEnrollments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Query the new enrollments collection
      const enrollmentsQuery = query(
        collection(db, 'enrollments'),
        orderBy('enrollmentDate', 'desc')
      );
      
      const snapshot = await getDocs(enrollmentsQuery);
      const enrollmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'enrollment', // Distinguish from legacy data
        ...doc.data(),
        enrollmentDate: doc.data().enrollmentDate?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
      
      setEnrollments(enrollmentsData);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Get enrollments for a specific student
  const getStudentEnrollments = useCallback((studentId) => {
    if (!studentId) return [];
    
    return enrollments.filter(enrollment => 
      enrollment.studentId === studentId
    );
  }, [enrollments]);

  // Get enrollments for a specific class
  const getClassEnrollments = useCallback((classId) => {
    if (!classId) return [];
    
    return enrollments.filter(enrollment => enrollment.classId === classId);
  }, [enrollments]);

  // Get enrollments for a specific course
  const getCourseEnrollments = useCallback((courseId) => {
    if (!courseId) return [];
    
    return enrollments.filter(enrollment => enrollment.courseId === courseId);
  }, [enrollments]);

  // Enroll a student using the new enrollment system
  const enrollStudent = async (enrollmentData) => {
    try {
      setError(null);
      
      const timestamp = serverTimestamp();
      const newEnrollment = {
        studentId: enrollmentData.studentId,
        courseId: enrollmentData.courseId,
        classId: enrollmentData.classId,
        
        // Denormalized data for efficient queries
        studentName: enrollmentData.studentName || enrollmentData.name,
        studentEmail: enrollmentData.studentEmail || enrollmentData.email,
        courseName: enrollmentData.courseName,
        courseLevel: enrollmentData.courseLevel,
        className: enrollmentData.className,
        
        // Enrollment details
        status: enrollmentData.status || 'active',
        progress: enrollmentData.progress || 0,
        attendance: enrollmentData.attendance || 0,
        amount: enrollmentData.amount || 0,
        currency: enrollmentData.currency || 'VND',
        paymentStatus: enrollmentData.paymentStatus || 'pending',
        notes: enrollmentData.notes || '',
        
        // Avatar data
        avatar: enrollmentData.avatar,
        avatarColor: enrollmentData.avatarColor,
        
        enrollmentDate: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: currentUser.uid
      };
      
      const docRef = await addDoc(collection(db, 'enrollments'), newEnrollment);
      
      // Add to local state immediately for better UX
      const enrollmentWithId = {
        ...newEnrollment,
        id: docRef.id,
        type: 'enrollment',
        enrollmentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setEnrollments(prev => [enrollmentWithId, ...prev]);
      
      return docRef.id;
    } catch (err) {
      console.error('Error enrolling student:', err);
      setError(err.message || 'Failed to enroll student');
      throw err;
    }
  };

  // Update enrollment status/progress
  const updateEnrollment = async (enrollmentId, updates) => {
    try {
      setError(null);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, 'enrollments', enrollmentId), updateData);
      
      // Update local state
      setEnrollments(prev => prev.map(enrollment => 
        enrollment.id === enrollmentId 
          ? { ...enrollment, ...updates, updatedAt: new Date() }
          : enrollment
      ));
    } catch (err) {
      console.error('Error updating enrollment:', err);
      setError('Failed to update enrollment');
      throw err;
    }
  };

  // Remove student from course/class
  const removeEnrollment = async (enrollmentId) => {
    try {
      setError(null);
      await deleteDoc(doc(db, 'enrollments', enrollmentId));
      
      // Remove from local state
      setEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));
    } catch (err) {
      console.error('Error removing enrollment:', err);
      setError('Failed to remove enrollment');
      throw err;
    }
  };

  // Get enrollment statistics
  const getEnrollmentStats = useCallback(() => {
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const droppedEnrollments = enrollments.filter(e => e.status === 'dropped').length;
    
    return {
      total: totalEnrollments,
      active: activeEnrollments,
      completed: completedEnrollments,
      dropped: droppedEnrollments
    };
  }, [enrollments]);

  // Search enrollments
  const searchEnrollments = useCallback((searchTerm, filters = {}) => {
    let filtered = enrollments;

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(enrollment =>
        enrollment.studentName?.toLowerCase().includes(term) ||
        enrollment.studentEmail?.toLowerCase().includes(term) ||
        enrollment.courseName?.toLowerCase().includes(term) ||
        enrollment.className?.toLowerCase().includes(term)
      );
    }

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(enrollment => enrollment.status === filters.status);
    }

    if (filters.classId) {
      filtered = filtered.filter(enrollment => enrollment.classId === filters.classId);
    }

    if (filters.courseId) {
      filtered = filtered.filter(enrollment => enrollment.courseId === filters.courseId);
    }

    if (filters.studentId) {
      filtered = filtered.filter(enrollment => enrollment.studentId === filters.studentId);
    }

    return filtered;
  }, [enrollments]);

  return {
    enrollments,
    loading,
    error,
    getStudentEnrollments,
    getClassEnrollments,
    getCourseEnrollments,
    enrollStudent,
    updateEnrollment,
    removeEnrollment,
    getEnrollmentStats,
    searchEnrollments,
    refetch: fetchEnrollments
  };
}; 