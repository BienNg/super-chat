import { useState, useEffect, useCallback } from 'react';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useEnrollments } from './useEnrollments';
import { useStudents } from './useStudents';
import { useCourses } from './useCourses';

/**
 * usePayments - Custom hook for managing payment data
 * Handles payment CRUD operations and financial statistics
 */
export const usePayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth();
    const { isStudentEnrolled, enrollStudent } = useEnrollments();
    const { getStudentById } = useStudents();
    const { courses } = useCourses();

    // Load payments on mount
    useEffect(() => {
        if (!currentUser) {
            setPayments([]);
            return;
        }

        setLoading(true);
        
        const paymentsQuery = query(
            collection(db, 'payments'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            paymentsQuery,
            (snapshot) => {
                const paymentData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    // Convert Firestore timestamps to JavaScript dates
                    createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
                    updatedAt: doc.data().updatedAt?.toDate?.() || new Date(doc.data().updatedAt),
                    paymentDate: doc.data().paymentDate || doc.data().createdAt?.toDate?.() || new Date()
                }));
                
                // Set payments directly from Firestore data (no fallback to sample data)
                setPayments(paymentData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching payments:', err);
                // On error, set empty array instead of sample data
                setPayments([]);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    // Add a new payment with automatic enrollment
    const addPayment = async (paymentData) => {
        if (!currentUser || !paymentData) {
            throw new Error('Missing required data for payment creation');
        }

        try {
            console.log('Processing payment with automatic enrollment check:', paymentData);

            // Check if auto-enrollment should be skipped (for existing enrollments)
            const skipAutoEnrollment = paymentData.skipAutoEnrollment;
            
            // Check if the payment includes student and course information for auto-enrollment
            const { studentId, courseId, studentName, studentEmail, courseName } = paymentData;
            
            if (studentId && courseId && !skipAutoEnrollment) {
                // Check if student is already enrolled in the course
                const alreadyEnrolled = isStudentEnrolled(studentId, courseId);
                console.log(`Student ${studentName} enrollment status for course ${courseName}:`, alreadyEnrolled);
                
                if (!alreadyEnrolled) {
                    console.log(`Auto-enrolling student ${studentName} in course ${courseName}`);
                    
                    // Find the course to get the classId
                    const selectedCourse = courses.find(c => c.id === courseId);
                    if (!selectedCourse) {
                        console.warn(`Course not found for courseId: ${courseId}, proceeding with payment only`);
                    } else {
                        try {
                            // Prepare enrollment data
                            const enrollmentData = {
                                studentId: studentId,
                                courseId: courseId,
                                classId: selectedCourse.classId,
                                studentName: studentName || 'Unknown Student',
                                studentEmail: studentEmail || '',
                                courseName: courseName || selectedCourse.courseName || 'Unknown Course',
                                courseLevel: selectedCourse.level || '',
                                className: selectedCourse.className || '',
                                status: 'active',
                                paymentStatus: 'paid',
                                amount: paymentData.amount || 0,
                                currency: paymentData.currency || 'VND',
                                notes: `Auto-enrolled via payment on ${new Date().toLocaleDateString()}`
                            };

                            // Enroll the student
                            const enrollmentId = await enrollStudent(enrollmentData);
                            console.log(`Successfully auto-enrolled student ${studentName} with enrollment ID: ${enrollmentId}`);
                            
                            // Add enrollment ID to payment data
                            paymentData.enrollmentId = enrollmentId;
                            paymentData.autoEnrolled = true;
                            
                        } catch (enrollmentError) {
                            console.error('Error auto-enrolling student:', enrollmentError);
                            // Continue with payment creation even if enrollment fails
                            console.log('Proceeding with payment creation despite enrollment failure');
                        }
                    }
                } else {
                    console.log(`Student ${studentName} is already enrolled in course ${courseName}`);
                }
            } else if (skipAutoEnrollment) {
                console.log('Skipping auto-enrollment logic - payment for existing enrollment');
            }

            // Create the payment (remove skipAutoEnrollment from the data before saving)
            const { skipAutoEnrollment: _, ...cleanPaymentData } = paymentData;
            
            const payment = {
                ...cleanPaymentData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: currentUser.uid,
                // Ensure we have required fields
                currency: paymentData.currency || 'VND',
                paymentType: paymentData.paymentType || 'full_payment'
            };

            const docRef = await addDoc(collection(db, 'payments'), payment);
            
            console.log('Payment created successfully:', { paymentId: docRef.id, autoEnrolled: paymentData.autoEnrolled });
            
            return {
                success: true,
                paymentId: docRef.id,
                payment: { id: docRef.id, ...payment },
                autoEnrolled: paymentData.autoEnrolled || false
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
            const updatedData = {
                ...updates,
                updatedAt: serverTimestamp()
            };

            await updateDoc(doc(db, 'payments', paymentId), updatedData);
            
            return { success: true, paymentId, updates: updatedData };

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
            await deleteDoc(doc(db, 'payments', paymentId));
            
            return { success: true, paymentId };

        } catch (error) {
            console.error('Error deleting payment:', error);
            throw error;
        }
    };

    // Get financial statistics
    const getFinancialStats = useCallback((currency = 'EUR') => {
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
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Filter payments by currency
        const allPayments = payments.filter(p => p.currency === currency);
        const completedPayments = allPayments;
        const pendingPayments = [];

        // Calculate totals
        const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        
        const currentMonthPayments = completedPayments.filter(p => 
            new Date(p.paymentDate) >= currentMonth
        );
        const monthlyRevenue = currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        const previousMonthPayments = completedPayments.filter(p => {
            const paymentDate = new Date(p.paymentDate);
            return paymentDate >= previousMonth && paymentDate <= previousMonthEnd;
        });
        const previousMonthRevenue = previousMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        const pendingAmount = 0;
        const pendingCount = 0;

        // Calculate growth percentages
        const monthlyGrowthPercent = previousMonthRevenue > 0 
            ? Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
            : monthlyRevenue > 0 ? 100 : 0;

        // For total growth, compare with same period last year or use a simple calculation
        const totalGrowthPercent = Math.round(Math.random() * 20 + 5); // Placeholder calculation

        return {
            totalRevenue,
            monthlyRevenue,
            pendingAmount,
            pendingCount,
            totalGrowthPercent,
            monthlyGrowthPercent
        };
    }, [payments]);

    // Get payments by student
    const getPaymentsByStudent = useCallback(async (studentId) => {
        if (!studentId || !currentUser) return [];

        try {
            const studentPayments = payments.filter(
                payment => payment.studentId === studentId
            );
            
            return studentPayments;
        } catch (error) {
            console.error('Error getting student payments:', error);
            return [];
        }
    }, [payments, currentUser]);

    // Get payments by course
    const getPaymentsByCourse = useCallback(async (courseId) => {
        if (!courseId || !currentUser) return [];

        try {
            const coursePayments = payments.filter(
                payment => payment.courseId === courseId
            );
            
            return coursePayments;
        } catch (error) {
            console.error('Error getting course payments:', error);
            return [];
        }
    }, [payments, currentUser]);

    // Get payments by enrollment
    const getPaymentsByEnrollment = useCallback(async (enrollmentId) => {
        if (!enrollmentId || !currentUser) return [];

        try {
            const enrollmentPayments = payments.filter(
                payment => payment.enrollmentId === enrollmentId
            );
            
            return enrollmentPayments;
        } catch (error) {
            console.error('Error getting enrollment payments:', error);
            return [];
        }
    }, [payments, currentUser]);

    // Search payments
    const searchPayments = useCallback((searchQuery) => {
        if (!searchQuery || !currentUser) return payments;

        const query = searchQuery.toLowerCase();
        
        return payments.filter(payment => 
            payment.studentName?.toLowerCase().includes(query) ||
            payment.courseName?.toLowerCase().includes(query) ||
            payment.studentEmail?.toLowerCase().includes(query) ||
            payment.notes?.toLowerCase().includes(query) ||
            payment.paymentMethod?.toLowerCase().includes(query)
        );
    }, [payments, currentUser]);

    // Get payment statistics by time period
    const getPaymentStatsByPeriod = useCallback((period = '30days', currency = 'EUR') => {
        const now = new Date();
        let startDate;

        switch (period) {
            case '7days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90days':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1year':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const periodPayments = payments.filter(p => 
            p.currency === currency && 
            new Date(p.paymentDate) >= startDate &&
            p.status === 'completed'
        );

        const totalAmount = periodPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const averageAmount = periodPayments.length > 0 ? totalAmount / periodPayments.length : 0;

        return {
            totalAmount,
            averageAmount,
            paymentCount: periodPayments.length,
            period,
            currency
        };
    }, [payments]);

    return {
        // State
        payments,
        loading,
        error,

        // Core operations
        addPayment,
        updatePayment,
        deletePayment,

        // Query operations
        getPaymentsByStudent,
        getPaymentsByCourse,
        getPaymentsByEnrollment,
        searchPayments,

        // Statistics
        getFinancialStats,
        getPaymentStatsByPeriod
    };
}; 