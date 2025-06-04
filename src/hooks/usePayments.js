import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client
import { useAuth } from '../contexts/AuthContext';
import { useEnrollments } from './useEnrollments';
import { useStudents } from './useStudents';
import { useCourses } from './useCourses';

// Helper to convert potential Supabase timestamp strings to Date objects
const toDateSafe = (timestamp) => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  // Attempt to parse if it's a string, otherwise default to now
  const parsedDate = new Date(timestamp);
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

/**
 * usePayments - Custom hook for managing payment data
 * Handles payment CRUD operations and financial statistics
 */
export const usePayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth(); // Assuming useAuth will provide Supabase user
    const { isStudentEnrolled, enrollStudent } = useEnrollments();
    const { getStudentById } = useStudents();
    const { courses } = useCourses();

    const fetchPayments = useCallback(async () => {
        if (!currentUser) {
            setPayments([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('payments')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            const paymentData = (data || []).map((p) => ({
                ...p,
                // Ensure date fields are Date objects
                created_at: toDateSafe(p.created_at),
                updated_at: toDateSafe(p.updated_at),
                payment_date: toDateSafe(p.payment_date || p.created_at) // Supabase typically uses snake_case
            }));
            
                setPayments(paymentData);
                setError(null);
        } catch (err) {
                console.error('Error fetching payments:', err);
                setPayments([]);
                setError(err.message);
        } finally {
                setLoading(false);
            }
    }, [currentUser]);

    // Load payments on mount and set up real-time listener
    useEffect(() => {
        fetchPayments();

        if (!currentUser) return;

        const subscription = supabase
            .channel('public:payments')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments' },
                (payload) => {
                    // console.log('Payments change received!', payload);
                    fetchPayments(); // Refetch payments on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [currentUser, fetchPayments]);

    // Add a new payment with automatic enrollment
    const addPayment = async (paymentData) => {
        if (!currentUser || !paymentData) {
            throw new Error('Missing required data for payment creation');
        }

        try {
            console.log('Processing payment with automatic enrollment check:', paymentData);

            const skipAutoEnrollment = paymentData.skipAutoEnrollment;
            const { studentId, courseId, studentName, studentEmail, courseName } = paymentData;
            let enrollmentIdToAdd = paymentData.enrollmentId;
            let autoEnrolledStatus = paymentData.autoEnrolled || false;
            
            if (studentId && courseId && !skipAutoEnrollment) {
                const alreadyEnrolled = await isStudentEnrolled(studentId, courseId); // Assuming isStudentEnrolled is async
                console.log(`Student ${studentName} enrollment status for course ${courseName}:`, alreadyEnrolled);
                
                if (!alreadyEnrolled) {
                    console.log(`Auto-enrolling student ${studentName} in course ${courseName}`);
                    const selectedCourse = courses.find(c => c.id === courseId);
                    if (!selectedCourse) {
                        console.warn(`Course not found for courseId: ${courseId}, proceeding with payment only`);
                    } else {
                        try {
                            const enrollmentData = {
                                student_id: studentId, // snake_case for Supabase
                                course_id: courseId,
                                class_id: selectedCourse.classId,
                                student_name: studentName || 'Unknown Student',
                                student_email: studentEmail || '',
                                course_name: courseName || selectedCourse.courseName || 'Unknown Course',
                                course_level: selectedCourse.level || '',
                                class_name: selectedCourse.className || '',
                                status: 'active',
                                payment_status: 'paid',
                                amount: paymentData.amount || 0,
                                currency: paymentData.currency || 'VND',
                                notes: `Auto-enrolled via payment on ${new Date().toLocaleDateString()}`
                            };
                            const newEnrollment = await enrollStudent(enrollmentData); // Assuming enrollStudent returns { id: ... }
                            if (newEnrollment && newEnrollment.id) {
                                console.log(`Successfully auto-enrolled student ${studentName} with enrollment ID: ${newEnrollment.id}`);
                                enrollmentIdToAdd = newEnrollment.id;
                                autoEnrolledStatus = true;
                            }
                        } catch (enrollmentError) {
                            console.error('Error auto-enrolling student:', enrollmentError);
                            console.log('Proceeding with payment creation despite enrollment failure');
                        }
                    }
                } else {
                    console.log(`Student ${studentName} is already enrolled in course ${courseName}`);
                }
            } else if (skipAutoEnrollment) {
                console.log('Skipping auto-enrollment logic - payment for existing enrollment');
            }

            const { skipAutoEnrollment: _, ...cleanPaymentData } = paymentData;
            
            const paymentInsert = {
                ...cleanPaymentData,
                enrollment_id: enrollmentIdToAdd, // snake_case
                auto_enrolled: autoEnrolledStatus,  // snake_case
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: currentUser.id, // Assuming currentUser.id from Supabase Auth
                currency: paymentData.currency || 'VND',
                payment_type: paymentData.paymentType || 'full_payment', // snake_case
                // Ensure all other fields are snake_case if that's your DB convention
                student_id: studentId, 
                course_id: courseId,
                // payment_date should be handled by cleanPaymentData or set explicitly
                payment_date: paymentData.paymentDate ? toDateSafe(paymentData.paymentDate).toISOString() : new Date().toISOString()
            };

            const { data: newPayment, error: insertError } = await supabase
                .from('payments')
                .insert([paymentInsert])
                .select()
                .single(); // Assuming you want the inserted row back and it's a single row

            if (insertError) throw insertError;
            
            console.log('Payment created successfully:', { paymentId: newPayment.id, autoEnrolled: newPayment.auto_enrolled });
            
            return {
                success: true,
                paymentId: newPayment.id,
                payment: newPayment, // newPayment is already the full object with id
                autoEnrolled: newPayment.auto_enrolled
            };

        } catch (error) {
            console.error('Error adding payment:', error);
            throw error;
        }
    };

    // Update a payment
    const updatePayment = async (paymentId, updates) => {
        if (!paymentId || !currentUser || !updates) {
            throw new Error('Missing required parameters for payment update');
        }

        try {
            // Convert camelCase keys in updates to snake_case if necessary for your DB
            const updatesForSupabase = { ...updates }; 
            if (updatesForSupabase.paymentDate) {
                updatesForSupabase.payment_date = toDateSafe(updatesForSupabase.paymentDate).toISOString();
                delete updatesForSupabase.paymentDate;
            }
            // Add other conversions if needed e.g. paymentType to payment_type

            const { data, error: updateError } = await supabase
                .from('payments')
                .update({
                    ...updatesForSupabase,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', paymentId)
                .select()
                .single();

            if (updateError) throw updateError;
            
            return { success: true, paymentId, updates: data };

        } catch (error) {
            console.error('Error updating payment:', error);
            throw error;
        }
    };

    // Delete a payment
    const deletePayment = async (paymentId) => {
        if (!paymentId || !currentUser) {
            throw new Error('Missing required parameters for payment deletion');
        }

        try {
            const { error: deleteError } = await supabase
                .from('payments')
                .delete()
                .eq('id', paymentId);

            if (deleteError) throw deleteError;
            
            return { success: true, paymentId };

        } catch (error) {
            console.error('Error deleting payment:', error);
            throw error;
        }
    };

    // Get financial statistics
    const getFinancialStats = useCallback((currency = 'VND') => { // Default to VND as per original
        if (!payments.length) {
            return {
                totalRevenue: 0,
                monthlyRevenue: 0,
                pendingAmount: 0,
                pendingCount: 0,
                totalGrowthPercent: 0,
                monthlyGrowthPercent: 0
            };
        }

        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Day 0 of current month is last day of previous

        const allPaymentsInCurrency = payments.filter(p => p.currency === currency);
        // Assuming all payments are completed for simplicity, adjust if status field exists
        const completedPayments = allPaymentsInCurrency;

        const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const currentMonthPayments = completedPayments.filter(p => 
            toDateSafe(p.payment_date) >= currentMonthStart
        );
        const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        const previousMonthPayments = completedPayments.filter(p => {
            const paymentDate = toDateSafe(p.payment_date);
            return paymentDate >= previousMonthStart && paymentDate <= previousMonthEnd;
        });
        const previousMonthRevenue = previousMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        let monthlyGrowthPercent = 0;
        if (previousMonthRevenue > 0) {
            monthlyGrowthPercent = ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
        } else if (monthlyRevenue > 0) {
            monthlyGrowthPercent = 100; // Infinite growth if previous month was 0
        }

        // Placeholder for total growth, as its calculation logic wasn't fully clear/complete
        const totalGrowthPercent = 0; 

        return {
            totalRevenue,
            monthlyRevenue,
            pendingAmount: 0, // Assuming no pending state from original simplified version
            pendingCount: 0,
            totalGrowthPercent,
            monthlyGrowthPercent
        };
    }, [payments]);

    return {
        payments,
        loading,
        error,
        addPayment,
        updatePayment,
        deletePayment,
        getFinancialStats
    };
}; 