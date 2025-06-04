import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export const useStudentEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();

  // Fetch all enrollments from the enrollments table
  const fetchEnrollments = useCallback(async () => {
    if (!currentUser?.id) {
      setEnrollments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Query the enrollments table
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .order('enrollment_date', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Convert data to expected format
      const enrollmentsData = data.map(enrollment => ({
        id: enrollment.id,
        type: 'enrollment', // Distinguish from legacy data
        studentId: enrollment.student_id,
        courseId: enrollment.course_id,
        classId: enrollment.class_id,
        studentName: enrollment.student_name,
        studentEmail: enrollment.student_email,
        courseName: enrollment.course_name,
        courseLevel: enrollment.course_level,
        className: enrollment.class_name,
        status: enrollment.status,
        progress: enrollment.progress,
        attendance: enrollment.attendance,
        amount: enrollment.amount,
        currency: enrollment.currency,
        paymentStatus: enrollment.payment_status,
        notes: enrollment.notes,
        avatar: enrollment.avatar,
        avatarColor: enrollment.avatar_color,
        enrollmentDate: new Date(enrollment.enrollment_date),
        createdAt: new Date(enrollment.created_at),
        updatedAt: new Date(enrollment.updated_at),
        createdBy: enrollment.created_by
      }));
      
      setEnrollments(enrollmentsData);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to fetch enrollments: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

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
      
      const timestamp = new Date().toISOString();
      const newEnrollment = {
        student_id: enrollmentData.studentId,
        course_id: enrollmentData.courseId,
        class_id: enrollmentData.classId,
        
        // Denormalized data for efficient queries
        student_name: enrollmentData.studentName || enrollmentData.name,
        student_email: enrollmentData.studentEmail || enrollmentData.email,
        course_name: enrollmentData.courseName,
        course_level: enrollmentData.courseLevel,
        class_name: enrollmentData.className,
        
        // Enrollment details
        status: enrollmentData.status || 'active',
        progress: enrollmentData.progress || 0,
        attendance: enrollmentData.attendance || 0,
        amount: enrollmentData.amount || 0,
        currency: enrollmentData.currency || 'VND',
        payment_status: enrollmentData.paymentStatus || 'pending',
        notes: enrollmentData.notes || '',
        
        // Avatar data
        avatar: enrollmentData.avatar,
        avatar_color: enrollmentData.avatarColor,
        
        enrollment_date: timestamp,
        created_at: timestamp,
        updated_at: timestamp,
        created_by: currentUser.id
      };
      
      const { data: newRecord, error: insertError } = await supabase
        .from('enrollments')
        .insert(newEnrollment)
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Add to local state immediately for better UX
      const enrollmentWithId = {
        ...enrollmentData,
        id: newRecord.id,
        type: 'enrollment',
        studentId: newRecord.student_id,
        courseId: newRecord.course_id,
        classId: newRecord.class_id,
        enrollmentDate: new Date(newRecord.enrollment_date),
        createdAt: new Date(newRecord.created_at),
        updatedAt: new Date(newRecord.updated_at),
        createdBy: newRecord.created_by
      };
      
      setEnrollments(prev => [enrollmentWithId, ...prev]);
      
      return newRecord.id;
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
      
      // Convert keys to snake_case for Supabase
      const convertedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        acc[snakeKey] = value;
        return acc;
      }, {});
      
      const updateData = {
        ...convertedUpdates,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollmentId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setEnrollments(prev => prev.map(enrollment => 
        enrollment.id === enrollmentId 
          ? { ...enrollment, ...updates, updatedAt: new Date() }
          : enrollment
      ));
    } catch (err) {
      console.error('Error updating enrollment:', err);
      setError('Failed to update enrollment: ' + err.message);
      throw err;
    }
  };

  // Remove student from course/class
  const removeEnrollment = async (enrollmentId) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);
      
      if (deleteError) throw deleteError;
      
      // Remove from local state
      setEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));
    } catch (err) {
      console.error('Error removing enrollment:', err);
      setError('Failed to remove enrollment: ' + err.message);
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