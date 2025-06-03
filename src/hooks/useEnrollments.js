import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/SupabaseAuthContext';

export const useEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();

  // Fetch all enrollments
  const fetchEnrollments = useCallback(async () => {
    if (!currentUser?.id) {
      setEnrollments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .order('enrollment_date', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      setEnrollments(data || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Get enrollments for a specific student
  const getStudentEnrollments = useCallback(async (studentId) => {
    if (!studentId) return [];
    
    try {
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId);
      
      if (fetchError) {
        throw fetchError;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error fetching student enrollments:', err);
      throw err;
    }
  }, []);

  // Get enrollments for a specific course
  const getCourseEnrollments = useCallback(async (courseId) => {
    if (!courseId) return [];
    
    try {
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', courseId);
      
      if (fetchError) {
        throw fetchError;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error fetching course enrollments:', err);
      throw err;
    }
  }, []);

  // Get enrollments for a specific class
  const getClassEnrollments = useCallback(async (classId) => {
    if (!classId) return [];
    
    try {
      const { data, error: fetchError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('class_id', classId);
      
      if (fetchError) {
        throw fetchError;
      }
      
      return data || [];
    } catch (err) {
      console.error('Error fetching class enrollments:', err);
      throw err;
    }
  }, []);

  // Enroll a student in a course
  const enrollStudent = async (enrollmentData) => {
    try {
      setError(null);
      
      console.log('Enrolling student with data:', enrollmentData);
      console.log('Current user:', currentUser);
      
      // Validate required fields
      if (!enrollmentData.student_id) {
        throw new Error('Student ID is required for enrollment');
      }
      
      if (!enrollmentData.student_name) {
        throw new Error('Student name is required for enrollment');
      }
      
      if (!currentUser?.id) {
        throw new Error('User must be authenticated to enroll students');
      }
      
      // Check if student is already enrolled in this course
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', enrollmentData.student_id)
        .eq('course_id', enrollmentData.course_id)
        .maybeSingle();
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingEnrollment) {
        throw new Error('Student is already enrolled in this course');
      }
      
      const now = new Date().toISOString();
      const newEnrollment = {
        student_id: enrollmentData.student_id, 
        course_id: enrollmentData.course_id,
        class_id: enrollmentData.class_id,
        
        // Denormalized student data
        student_name: enrollmentData.student_name,
        student_email: enrollmentData.student_email,
        
        // Denormalized course data
        course_name: enrollmentData.course_name,
        course_level: enrollmentData.course_level,
        
        // Denormalized class data
        class_name: enrollmentData.class_name,
        
        // Enrollment specific data
        status: enrollmentData.status || 'active',
        progress: enrollmentData.progress || 0,
        attendance: enrollmentData.attendance || 0,
        grade: enrollmentData.grade || null,
        
        // Payment information
        amount: enrollmentData.amount || 0,
        currency: enrollmentData.currency || 'VND',
        payment_status: enrollmentData.payment_status || 'pending',
        payment_id: enrollmentData.payment_id || null,
        
        // Dates
        enrollment_date: now,
        start_date: enrollmentData.start_date || null,
        end_date: enrollmentData.end_date || null,
        completion_date: enrollmentData.completion_date || null,
        
        // Additional information
        notes: enrollmentData.notes || '',
        
        // Metadata
        created_at: now,
        updated_at: now,
        created_by: currentUser.id
      };
      
      console.log('Creating enrollment record:', newEnrollment);
      
      const { data, error: insertError } = await supabase
        .from('enrollments')
        .insert([newEnrollment])
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      console.log('Enrollment created successfully:', data[0]);
      
      // Add to local state immediately for better UX
      const newEnrollmentRecord = data[0];
      setEnrollments(prev => [newEnrollmentRecord, ...prev]);
      
      return newEnrollmentRecord.id;
    } catch (err) {
      console.error('Error enrolling student:', err);
      console.error('Enrollment data that failed:', enrollmentData);
      console.error('Current user:', currentUser);
      setError(err.message || 'Failed to enroll student');
      throw err;
    }
  };

  // Update enrollment
  const updateEnrollment = async (enrollmentId, updates) => {
    try {
      setError(null);
      
      const now = new Date().toISOString();
      const updateData = {
        ...updates,
        updated_at: now
      };

      const { error: updateError } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollmentId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update local state
      setEnrollments(prev => prev.map(enrollment => 
        enrollment.id === enrollmentId 
          ? { ...enrollment, ...updates, updated_at: now }
          : enrollment
      ));
    } catch (err) {
      console.error('Error updating enrollment:', err);
      setError('Failed to update enrollment');
      throw err;
    }
  };

  // Update student progress
  const updateStudentProgress = async (enrollmentId, progress) => {
    try {
      await updateEnrollment(enrollmentId, { progress });
    } catch (err) {
      console.error('Error updating student progress:', err);
      throw err;
    }
  };

  // Update student attendance
  const updateStudentAttendance = async (enrollmentId, attendance) => {
    try {
      await updateEnrollment(enrollmentId, { attendance });
    } catch (err) {
      console.error('Error updating student attendance:', err);
      throw err;
    }
  };

  // Update enrollment status
  const updateEnrollmentStatus = async (enrollmentId, status, additionalData = {}) => {
    try {
      const updateData = { status, ...additionalData };
      
      // If completing the course, set completion date
      if (status === 'completed' && !additionalData.completion_date) {
        updateData.completion_date = new Date().toISOString();
      }
      
      await updateEnrollment(enrollmentId, updateData);
    } catch (err) {
      console.error('Error updating enrollment status:', err);
      throw err;
    }
  };

  // Delete enrollment
  const removeEnrollment = async (enrollmentId) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Remove from local state
      setEnrollments(prev => prev.filter(enrollment => enrollment.id !== enrollmentId));
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      setError('Failed to delete enrollment');
      throw err;
    }
  };

  // Create enrollment with payment
  const createEnrollmentWithPayment = async (enrollmentData, paymentData) => {
    try {
      setError(null);
      
      // First create the payment record
      const now = new Date().toISOString();
      const newPayment = {
        student_id: enrollmentData.student_id,
        course_id: enrollmentData.course_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'VND',
        payment_method: paymentData.payment_method,
        status: paymentData.status || 'completed',
        transaction_id: paymentData.transaction_id,
        payment_date: paymentData.payment_date || now,
        notes: paymentData.notes || '',
        created_at: now,
        created_by: currentUser.id
      };
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([newPayment])
        .select();
      
      if (paymentError) {
        throw paymentError;
      }
      
      const paymentId = paymentData[0].id;
      
      // Then create the enrollment with the payment info
      const enrollmentWithPayment = {
        ...enrollmentData,
        payment_id: paymentId,
        payment_status: 'paid'
      };
      
      const enrollmentId = await enrollStudent(enrollmentWithPayment);
      
      return { enrollmentId, paymentId };
    } catch (err) {
      console.error('Error creating enrollment with payment:', err);
      setError('Failed to create enrollment with payment');
      throw err;
    }
  };

  // Update payment status
  const updatePaymentStatus = async (enrollmentId, paymentStatus, paymentData = {}) => {
    try {
      // First update the enrollment's payment status
      await updateEnrollment(enrollmentId, { payment_status: paymentStatus });
      
      // Get the enrollment to access the payment ID
      const { data: enrollment, error: fetchError } = await supabase
        .from('enrollments')
        .select('payment_id')
        .eq('id', enrollmentId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      const paymentId = enrollment.payment_id;
      
      // If there's a payment ID and payment data, update the payment record
      if (paymentId && Object.keys(paymentData).length > 0) {
        const now = new Date().toISOString();
        const updateData = {
          ...paymentData,
          updated_at: now,
          status: paymentStatus
        };
        
        const { error: updateError } = await supabase
          .from('payments')
          .update(updateData)
          .eq('id', paymentId);
        
        if (updateError) {
          throw updateError;
        }
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      throw err;
    }
  };

  return {
    enrollments,
    loading,
    error,
    fetchEnrollments,
    getStudentEnrollments,
    getCourseEnrollments,
    getClassEnrollments,
    enrollStudent,
    updateEnrollment,
    updateStudentProgress,
    updateStudentAttendance,
    updateEnrollmentStatus,
    removeEnrollment,
    createEnrollmentWithPayment,
    updatePaymentStatus
  };
}; 