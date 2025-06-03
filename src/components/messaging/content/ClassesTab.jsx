import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Edit, 
  Calendar, 
  Users, 
  Globe, 
  FileText, 
  ExternalLink, 
  Clock,
  MapPin,
  GraduationCap,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  ChevronRight,
  BookOpen,
  Award,
  TrendingUp,
  Trash2,
  ChevronLeft,
  ChevronDown,
  ArrowRight,
  CreditCard,
  DollarSign,
  AlertCircle,
  Circle,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { useClasses } from '../../../hooks/useClasses';
import { useCourses } from '../../../hooks/useCourses';
import { useEnrollments } from '../../../hooks/useEnrollments';
import { useStudents } from '../../../hooks/useStudents';
import { usePayments } from '../../../hooks/usePayments';
import CreateCourseModal from '../classes/CreateCourseModal';
import AddStudentModal from '../../crm/content/AddStudentModal';
import ClassDetailsView from '../classes/ClassDetailsView';
import { StudentSelector } from '../classes/components';
import PaymentModal from '../../shared/PaymentModal';
import StudentDetailsModal from '../../shared/StudentDetailsModal';
import PaymentSuccessToast from '../../shared/PaymentSuccessToast';
import ActionsDropdown from '../../shared/ActionsDropdown';
import SendCourseStudentToChatModal from './SendCourseStudentToChatModal';
import SendCourseToChatModal from './SendCourseToChatModal';
import { generateChannelUrl, getMiddleClickHandlers } from '../../../utils/navigation';

/**
 * ClassesTab - Classes tab content component
 * Handles class management and display
 */
export const ClassesTab = ({
  channelId,
  subTab,
  onSubTabSelect,
  activeChannel
}) => {
  const { getClassByChannelId } = useClasses();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [removingEnrollmentId, setRemovingEnrollmentId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { enrollmentId, studentName, courseName }
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState(null); // For pre-filling payment modal
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null); // For student details modal
  const [autoEnrollCourseId, setAutoEnrollCourseId] = useState(null); // For auto-enrolling new students in specific course
  const [showSendToChatModal, setShowSendToChatModal] = useState(false);
  const [sendToChatData, setSendToChatData] = useState(null); // { enrollment, course, payments }
  const [showSendCourseToChatModal, setShowSendCourseToChatModal] = useState(false);
  const [courseToChatData, setCourseToChatData] = useState(null); // { course, classData, enrollments }
  const [paymentSuccessToast, setPaymentSuccessToast] = useState({
    isVisible: false,
    autoEnrolled: false,
    studentName: '',
    courseName: '',
    amount: 0,
    currency: 'VND'
  });

  // Course navigation refs and state
  const courseRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);
  const [isNavigationVisible, setIsNavigationVisible] = useState(false);
  const lastActiveCourseRef = useRef(0);

  // Use the enrollments hook for all student management
  const {
    enrollments,
    loading: studentsLoading,
    error: studentsError,
    enrollStudent,
    removeEnrollment: removeStudentFromClass,
    getEnrollmentStats: getClassStats,
    getClassEnrollments,
    getCourseEnrollments,
    getEnrichedEnrollments,
    updateEnrollment
  } = useEnrollments();

  // Use the students hook for creating/managing student records
  const { addStudent } = useStudents();

  // Use the courses hook
  const { courses, loading: coursesLoading, createCourse, deleteCourse, updateCourse, refetch: refetchCourses } = useCourses(classData?.id);

  // Use the payments hook for creating payments
  const { addPayment, getPaymentsByEnrollment } = usePayments();

  const [enrichedEnrollments, setEnrichedEnrollments] = useState({});
  const [enrollmentPayments, setEnrollmentPayments] = useState({}); // Store payment data by enrollment ID

  // Get class-specific students from enrollments
  const displayStudents = classData?.id ? getClassEnrollments(classData.id) : [];

  useEffect(() => {
    const loadClassData = async () => {
      if (channelId) {
        try {
          setLoading(true);
          const classInfo = await getClassByChannelId(channelId);
          setClassData(classInfo);
        } catch (error) {
          console.error('Error loading class data:', error);
          setClassData(null);
        } finally {
          setLoading(false);
        }
      } else {
        // If no channelId, stop loading immediately
        setLoading(false);
        setClassData(null);
      }
    };
    
    loadClassData();
  }, [channelId]);

  // Reset course navigation state when channelId or courses change
  useEffect(() => {
    setActiveCourseIndex(0);
    lastActiveCourseRef.current = 0;
    setIsNavigationVisible(false);
    courseRefs.current = {};
  }, [channelId, courses]);

  // Handle keyboard shortcuts for confirmation modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (confirmDelete && event.key === 'Escape') {
        handleCancelDelete();
      }
    };

    if (confirmDelete) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirmDelete]);

  const handleAddStudent = async (studentData) => {
    try {
      console.log('Creating new student for class enrollment:', studentData);
      
      // Step 1: Create the student record in the students collection first
      const newStudentData = {
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone || '',
        notes: studentData.notes || '',
        avatar: studentData.avatar,
        avatarColor: studentData.avatarColor,
        // Additional fields from the CRM modal
        location: studentData.location,
        city: studentData.city,
        platform: studentData.platform,
        categories: studentData.categories || []
      };

      console.log('Creating student record in students collection:', newStudentData);
      
      // Use the useStudents hook to create the student record
      const studentDocId = await addStudent(newStudentData);
      
      console.log('Student record created successfully with ID:', studentDocId);

      // Step 2: Create class-level enrollment using the actual student document ID
      const enrollmentData = {
        studentId: studentDocId, // Use the actual database ID from the student record
        studentName: studentData.name,
        studentEmail: studentData.email,
        classId: classData?.id,
        className: classData?.className || '',
        courseId: null, // Class-level enrollment, not course-specific
        courseName: '',
        courseLevel: '',
        status: 'active',
        progress: 0,
        attendance: 0,
        amount: 0,
        currency: 'VND',
        notes: studentData.notes || '',
        avatar: studentData.avatar,
        avatarColor: studentData.avatarColor
      };
      
      const result = await enrollStudent(enrollmentData);
      console.log('Student created and enrolled successfully in class:', {
        studentName: newStudentData.name,
        studentId: studentDocId,
        enrollmentId: result
      });
      
      // Don't close modal here - let the CRM modal handle it
      // setShowAddStudentModal(false);
    } catch (error) {
      console.error('Error adding student:', error);
      // Re-throw the error so the CRM modal can handle it
      throw error;
    }
  };

  const handleCreateStudentForCourse = async (studentData) => {
    try {
      console.log('Creating new student for course enrollment:', studentData);
      
      // Step 1: Create the student record in the students collection first
      const newStudentData = {
        name: studentData.name,
        email: studentData.email,
        phone: studentData.phone || '',
        notes: studentData.notes || '',
        avatar: studentData.avatar,
        avatarColor: studentData.avatarColor,
        // Additional fields from the CRM modal
        location: studentData.location,
        city: studentData.city,
        platform: studentData.platform,
        categories: studentData.categories || []
      };

      console.log('Creating student record in students collection:', newStudentData);
      
      // Use the useStudents hook to create the student record
      const studentDocId = await addStudent(newStudentData);
      
      console.log('Student record created successfully with ID:', studentDocId);

      // Step 2: If auto-enrollment course is specified, create enrollment with the actual student ID
      if (autoEnrollCourseId) {
        const course = courses.find(c => c.id === autoEnrollCourseId);
        if (course) {
          console.log('Creating enrollment for student ID:', studentDocId, 'in course:', course.courseName);
          
          // Create enrollment using the actual student document ID
          await enrollStudent({
            studentId: studentDocId, // Use the actual database ID from the student record
            studentName: newStudentData.name,
            studentEmail: newStudentData.email,
            courseId: autoEnrollCourseId,
            classId: classData?.id,
            courseName: course.courseName || '',
            courseLevel: course.level || '',
            className: classData?.className || '',
            status: 'active',
            progress: 0,
            attendance: 0,
            amount: 0,
            currency: 'VND',
            notes: newStudentData.notes,
            avatar: newStudentData.avatar,
            avatarColor: newStudentData.avatarColor
          });
          
          console.log('Student created and enrolled successfully:', {
            studentName: newStudentData.name,
            studentId: studentDocId,
            courseName: course.courseName
          });
          
          // Refresh enriched enrollment data
          await loadEnrichedEnrollments();
        }
      }
      
      // Don't close modal here - let the CRM modal handle it
    } catch (error) {
      console.error('Error creating student for course:', error);
      // Re-throw the error so the CRM modal can handle it
      throw error;
    }
  };

  const handleOpenCreateStudentForCourse = (courseId) => {
    setAutoEnrollCourseId(courseId);
    setShowAddStudentModal(true);
  };

  const handleSelectExistingStudent = async (enrollmentData, courseId) => {
    try {
      // Use the enrollment system directly
      await enrollStudent({
        ...enrollmentData,
        courseId: courseId,
        classId: classData?.id,
        courseName: courses.find(c => c.id === courseId)?.courseName || '',
        courseLevel: courses.find(c => c.id === courseId)?.level || '',
        className: classData?.className || ''
      });
      
      console.log('Student enrolled successfully in course:', enrollmentData.studentName);
      
      // Refresh enriched enrollment data
      await loadEnrichedEnrollments();
    } catch (error) {
      console.error('Error enrolling student in course:', error);
      
      // Check if it's a duplicate student error
      if (error.message.includes('already enrolled')) {
        console.warn('Student is already enrolled in this course');
        return;
      }
      
      // Show error message to user for other types of errors
      alert('Error enrolling student: ' + error.message);
    }
  };

  const handleCourseCreated = async () => {
    setShowCreateCourse(false);
    setEditingCourse(null);
    // Refresh the courses data to show the newly created course
    if (refetchCourses) {
      await refetchCourses();
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowCreateCourse(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(courseId);
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course: ' + error.message);
      }
    }
  };

  const handleRemoveStudent = async (enrollmentId, studentName, courseName) => {
    if (removingEnrollmentId) return; // Prevent multiple simultaneous removals
    
    // Show confirmation modal instead of window.confirm
    setConfirmDelete({ enrollmentId, studentName, courseName });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    
    const { enrollmentId, studentName } = confirmDelete;
    
    try {
      setRemovingEnrollmentId(enrollmentId);
      
      // Remove the enrollment
      await removeStudentFromClass(enrollmentId);
      console.log('Student removed successfully from course:', studentName);
      
      // Refresh enriched enrollment data
      await loadEnrichedEnrollments();
    } catch (error) {
      console.error('Error removing student from course:', error);
      alert('Error removing student: ' + error.message);
    } finally {
      setRemovingEnrollmentId(null);
      setConfirmDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleAddPayment = (enrollment, course) => {
    setPaymentModalData({
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      studentEmail: enrollment.studentEmail,
      courseId: course.id,
      courseName: course.courseName,
      enrollmentId: enrollment.id,
      currency: 'VND'
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      console.log('Processing payment for existing enrollment:', paymentData);
      console.log('Payment modal data:', paymentModalData);
      
      // For existing enrollments, we should NOT trigger auto-enrollment
      // Instead, we should create a payment and update the existing enrollment
      
      // Step 1: Create the payment record
      const paymentDataForCreation = {
        ...paymentData,
        enrollmentId: paymentModalData.enrollmentId,
        studentId: paymentModalData.studentId,
        courseId: paymentModalData.courseId,
        // Remove fields that might trigger auto-enrollment logic
        // We'll handle enrollment updates separately
        skipAutoEnrollment: true
      };

      console.log('Creating payment record:', paymentDataForCreation);
      
      // Create the payment using the usePayments hook (but avoid auto-enrollment)
      const result = await addPayment(paymentDataForCreation);
      
      console.log('Payment created successfully:', result);
      
      // Step 2: Update the existing enrollment with payment information
      const enrollmentUpdates = {
        paymentStatus: 'paid', // Update payment status
        // Update the total amount paid (you might want to accumulate this)
        lastPaymentDate: new Date(),
        lastPaymentAmount: parseFloat(paymentData.amount) || 0,
        lastPaymentId: result.paymentId,
        // Add any other payment-related fields you want to track
        updatedAt: new Date()
      };
      
      console.log('Updating enrollment with payment info:', {
        enrollmentId: paymentModalData.enrollmentId,
        updates: enrollmentUpdates
      });
      
      // Update the enrollment record
      await updateEnrollment(paymentModalData.enrollmentId, enrollmentUpdates);
      
      console.log('Enrollment updated successfully with payment information');
      
      // Step 3: Refresh the enrollment data to show updated payment info
      await loadEnrichedEnrollments();
      
      // Close modal
      setShowPaymentModal(false);
      setPaymentModalData(null);
      
      // Show payment success toast
      setPaymentSuccessToast({
        isVisible: true,
        autoEnrolled: false, // This is not auto-enrollment, it's payment for existing enrollment
        studentName: paymentModalData?.studentName || 'Unknown Student',
        courseName: paymentModalData?.courseName || 'Unknown Course',
        amount: parseFloat(paymentData.amount) || 0,
        currency: paymentData.currency || 'VND'
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error; // Let the modal handle the error
    }
  };

  const handleOpenStudentDetails = (enrollment) => {
    console.log('Opening student details for enrollment:', enrollment);
    
    // Validate enrollment data before opening modal
    if (!enrollment) {
      console.error('No enrollment data provided to handleOpenStudentDetails');
      return;
    }
    
    if (!enrollment.studentName && !enrollment.studentId) {
      console.error('Invalid enrollment data - missing studentName and studentId:', enrollment);
      return;
    }
    
    setSelectedEnrollment(enrollment);
    setShowStudentDetailsModal(true);
  };

  const handleCloseStudentDetails = () => {
    setShowStudentDetailsModal(false);
    setSelectedEnrollment(null);
  };

  const handleSendToChat = (enrollment, course) => {
    // Get payments for this enrollment
    const payments = enrollmentPayments[enrollment.id] || [];
    
    setSendToChatData({
      enrollment,
      course,
      payments
    });
    setShowSendToChatModal(true);
  };

  const handleCloseSendToChat = () => {
    setShowSendToChatModal(false);
    setSendToChatData(null);
  };

  const handleSendCourseToChat = (course) => {
    // Get enrollments for this course
    const courseEnrollments = enrichedEnrollments[course.id] || getCourseEnrollments(course.id);
    
    setCourseToChatData({
      course,
      classData,
      enrollments: courseEnrollments
    });
    setShowSendCourseToChatModal(true);
  };

  const handleCloseSendCourseToChat = () => {
    setShowSendCourseToChatModal(false);
    setCourseToChatData(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return 'Not set';
    
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Determine course status based on dates
  const getCourseStatus = (course) => {
    if (!course.beginDate || !course.endDate) {
      return 'planning'; // Default to planning if dates are missing
    }

    const currentDate = new Date();
    const startDate = new Date(course.beginDate);
    const endDate = new Date(course.endDate);
    
    // Set time to start of day for accurate comparison
    currentDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (currentDate < startDate) {
      return 'planning'; // Before start date
    } else if (currentDate >= startDate && currentDate <= endDate) {
      return 'active'; // Between start and end date (inclusive)
    } else {
      return 'completed'; // After end date
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
      planning: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Planning' },
      completed: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Completed' },
      inactive: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Inactive' },
      archived: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Archived' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadgeEnhanced = (status) => {
    const statusConfig = {
      active: { 
        bg: 'bg-gradient-to-r from-emerald-100 to-green-100', 
        text: 'text-emerald-700', 
        label: 'Active',
        icon: '●',
        iconColor: 'text-emerald-500'
      },
      planning: { 
        bg: 'bg-gradient-to-r from-yellow-100 to-orange-100', 
        text: 'text-yellow-700', 
        label: 'Planning',
        icon: '◐',
        iconColor: 'text-yellow-500'
      },
      completed: { 
        bg: 'bg-gradient-to-r from-gray-100 to-slate-100', 
        text: 'text-gray-700', 
        label: 'Completed',
        icon: '◻',
        iconColor: 'text-gray-500'
      },
      inactive: { 
        bg: 'bg-gradient-to-r from-gray-100 to-slate-100', 
        text: 'text-gray-700', 
        label: 'Inactive',
        icon: '○',
        iconColor: 'text-gray-500'
      },
      archived: { 
        bg: 'bg-gradient-to-r from-gray-100 to-slate-100', 
        text: 'text-gray-700', 
        label: 'Archived',
        icon: '◻',
        iconColor: 'text-gray-500'
      }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} shadow-sm border border-white/50`}>
        <span className={`mr-1.5 ${config.iconColor}`}>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  // Filter students based on search term
  const filteredStudents = displayStudents.filter(student =>
    student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sub-tabs for Classes
  const classesSubTabs = [
    { id: 'courses', label: 'Courses' },
    { id: 'info', label: 'Info' }
  ];

  // Load enriched enrollment data with payment information
  const loadEnrichedEnrollments = async () => {
    if (!courses.length) return;
    
    console.log('Loading enriched enrollments for courses:', courses);
    
    const enrichedData = {};
    const paymentData = {};
    
    for (const course of courses) {
      try {
        const enrichedEnrollments = await getEnrichedEnrollments(course.id);
        console.log(`Enriched enrollments for course ${course.id}:`, enrichedEnrollments);
        enrichedData[course.id] = enrichedEnrollments;
        
        // Load payment data for each enrollment
        const enrollments = enrichedEnrollments || getCourseEnrollments(course.id);
        for (const enrollment of enrollments) {
          if (!enrollment || !enrollment.id) {
            console.warn('Skipping invalid enrollment:', enrollment);
            continue;
          }
          
          try {
            const payments = await getPaymentsByEnrollment(enrollment.id);
            paymentData[enrollment.id] = payments;
          } catch (error) {
            console.error('Error loading payments for enrollment:', enrollment.id, error);
            paymentData[enrollment.id] = [];
          }
        }
      } catch (error) {
        console.error('Error loading enriched enrollments for course:', course.id, error);
        const fallbackEnrollments = getCourseEnrollments(course.id);
        console.log(`Fallback enrollments for course ${course.id}:`, fallbackEnrollments);
        enrichedData[course.id] = fallbackEnrollments;
      }
    }
    
    console.log('Final enriched enrollments data:', enrichedData);
    console.log('Final payment data:', paymentData);
    
    setEnrichedEnrollments(enrichedData);
    setEnrollmentPayments(paymentData);
  };

  // Load enriched enrollments when courses change
  useEffect(() => {
    loadEnrichedEnrollments();
  }, [courses, getCourseEnrollments]);

  // Course Navigation Component
  const CourseNavigationDots = ({ courses, activeCourseIndex, onCourseSelect }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);

    const generateCourseIcon = (course, index) => {
      // Get course status using the existing getCourseStatus function
      const status = getCourseStatus(course);
      
      // Define gradient colors based on course status
      const statusColors = {
        'completed': 'bg-gradient-to-br from-gray-400 to-gray-600',
        'active': 'bg-gradient-to-br from-green-400 to-green-600', 
        'planning': 'bg-gradient-to-br from-yellow-400 to-yellow-600'
      };
      
      // Get the appropriate color class based on status, fallback to active if status not found
      const colorClass = statusColors[status] || statusColors.active;
      
      // Display course level instead of initials
      const level = course.level || (index + 1).toString();

      return (
        <div className={`${colorClass} flex items-center justify-center text-white font-semibold text-sm shadow-lg border-2 border-white transition-all duration-300 ease-out ${
          isNavigationExpanded ? 'w-12 h-12 rounded-full' : 'w-3 h-3 rounded-full'
        }`}>
          {isNavigationExpanded && level}
        </div>
      );
    };

    if (courses.length < 2 || !courses.every(course => course && (course.id || course.courseName))) return null;

    return (
      <div 
        className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50"
        onMouseEnter={() => setIsNavigationExpanded(true)}
        onMouseLeave={() => {
          setIsNavigationExpanded(false);
          setHoveredIndex(null);
        }}
      >
        <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 transition-all duration-300 ease-out ${
          isNavigationExpanded ? 'p-4' : 'p-2'
        }`}>
          {/* Course Dots */}
          <div className={`transition-all duration-300 ease-out ${
            isNavigationExpanded ? 'space-y-3' : 'space-y-1'
          }`}>
            {courses.map((course, index) => (
              <div
                key={course.id || index}
                className="relative group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <button
                  onClick={() => onCourseSelect(index)}
                  className={`relative block transition-all duration-300 ease-out ${
                    activeCourseIndex === index && isNavigationExpanded
                      ? 'scale-110 transform'
                      : activeCourseIndex === index && !isNavigationExpanded
                      ? 'scale-125 transform'
                      : 'scale-100 hover:scale-105 transform'
                  }`}
                  title={isNavigationExpanded ? course.courseName : `${course.courseName} (${course.level || index + 1})`}
                >
                  {generateCourseIcon(course, index)}
                  
                  {/* Active indicator ring - only show when expanded */}
                  {activeCourseIndex === index && isNavigationExpanded && (
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-400 animate-pulse"></div>
                  )}
                  
                  {/* Active indicator for collapsed state */}
                  {activeCourseIndex === index && !isNavigationExpanded && (
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-400 animate-pulse"></div>
                  )}
                  
                  {/* Hover glow effect - only when expanded */}
                  {hoveredIndex === index && activeCourseIndex !== index && isNavigationExpanded && (
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-300/60 animate-pulse"></div>
                  )}
                </button>
                
                {/* Course name tooltip - only show when expanded and hovered */}
                {hoveredIndex === index && isNavigationExpanded && (
                  <div className="absolute right-full mr-4 top-1/2 transform -translate-y-1/2 whitespace-nowrap">
                    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                      {course.courseName}
                      <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Function to scroll to specific course
  const scrollToCourse = (courseIndex) => {
    const courseId = courses[courseIndex]?.id || courseIndex;
    const courseElement = courseRefs.current[courseId];
    
    if (courseElement && scrollContainerRef.current) {
      courseElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      setActiveCourseIndex(courseIndex);
    }
  };

  // Intersection Observer to track active course
  useEffect(() => {
    if (courses.length < 2) return;

    let observer = null;

    // Add a small delay to ensure DOM elements are ready
    const timeoutId = setTimeout(() => {
      if (!scrollContainerRef.current) return;

      observer = new IntersectionObserver(
        (entries) => {
          // Find the most visible entry
          let bestEntry = null;
          let bestRatio = 0;

          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio;
              bestEntry = entry;
            }
          });

          if (bestEntry) {
            const courseId = bestEntry.target.getAttribute('data-course-id');
            const courseIndex = courses.findIndex(course => (course.id || course) === courseId);
            
            if (courseIndex !== -1) {
              const currentActive = lastActiveCourseRef.current;
              
              // Add hysteresis: only change if the new course is significantly more visible
              // or if we're already very close to switching
              let shouldSwitch = false;
              
              if (courseIndex === currentActive) {
                // Same course, keep it active if it's still reasonably visible
                shouldSwitch = bestRatio > 0.1;
              } else {
                // Different course, require higher threshold to switch
                shouldSwitch = bestRatio > 0.3;
              }
              
              if (shouldSwitch) {
                console.log('Setting active course index to:', courseIndex, 'for course:', courses[courseIndex]?.courseName, 'with ratio:', bestRatio);
                setActiveCourseIndex(courseIndex);
                lastActiveCourseRef.current = courseIndex;
              }
            }
          }
        },
        {
          root: scrollContainerRef.current,
          rootMargin: '-25% 0px -25% 0px', // More conservative margins to reduce sensitivity
          threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0] // Fewer, more spaced thresholds
        }
      );

      // Observe all course elements that exist
      const currentRefs = Object.values(courseRefs.current).filter(ref => ref != null);
      
      if (currentRefs.length > 0) {
        currentRefs.forEach((ref) => {
          observer.observe(ref);
        });
      }
    }, 100); // Small delay to ensure elements are rendered

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [courses]);

  const renderCoursesView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (!classData) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <GraduationCap className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No class found</h3>
          <p className="mt-1 text-sm text-gray-500">
            This channel doesn't have a class linked to it yet.
          </p>
        </div>
      );
    }

    // Check if there are no actual courses
    if (courses.length === 0) {
      return (
        <div className="bg-gray-50 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                  <p className="text-sm text-gray-500">No courses available</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCreateCourse(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Course
                  </button>
                </div>
              </div>
            </div>

            {/* No Courses Message */}
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mb-6" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Courses Available</h3>
              <p className="text-gray-500 text-center mb-8 max-w-md">
                This class doesn't have any courses yet. Create your first course to get started with managing your curriculum and students.
              </p>
              <button 
                onClick={() => setShowCreateCourse(true)}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Course
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 h-full flex flex-col">
        {/* Courses List - Scrollable Container */}
        <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                <p className="text-sm text-gray-500">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCreateCourse(true)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8 px-8 pt-8 pb-24">
            {courses.map((course, index) => (
              <div 
                key={course.id || index} 
                ref={el => courseRefs.current[course.id || index] = el}
                data-course-id={course.id || index}
                className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 ease-out overflow-hidden"
              >
                {/* Course Header */}
                <div className="relative bg-white px-8 py-6 border-b border-gray-100">
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Course Icon with Animation */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ease-out">
                          <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        {/* Pulse Animation */}
                        <div className="absolute inset-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl opacity-20 animate-pulse"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Course Title */}
                        <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                          {course.courseName}
                        </h2>
                        
                        {/* Course Meta Information - All in one row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                            <Globe className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium text-gray-700">{classData?.format || 'Not specified'}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{classData?.formatOption || 'Not specified'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                            <Award className="w-4 h-4 text-purple-500" />
                            <span className="font-medium text-gray-700">{course.level}</span>
                          </div>
                          
                          {(course.startTime || course.endTime || course.timezone || classData?.startTime || classData?.endTime || classData?.timezone) && (
                            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/20">
                              <Clock className="w-4 h-4 text-emerald-500" />
                              <span className="font-medium text-gray-700">
                                {(course.startTime || classData?.startTime) && (course.endTime || classData?.endTime)
                                  ? `${course.startTime || classData?.startTime} - ${course.endTime || classData?.endTime}`
                                  : (course.startTime || classData?.startTime) || (course.endTime || classData?.endTime) || 'Time not set'
                                }
                              </span>
                              {(course.timezone || classData?.timezone) && (
                                <>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600 uppercase text-xs font-medium">{course.timezone || classData?.timezone}</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            {getStatusBadgeEnhanced(getCourseStatus(course))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {course.id !== 'default' && (
                      <ActionsDropdown
                        itemId={course.id}
                        item={course}
                        actions={[
                          {
                            key: 'edit',
                            label: 'Edit Course',
                            icon: Edit,
                            onClick: (course) => handleEditCourse(course),
                            title: 'Edit course details'
                          },
                          {
                            key: 'sendToChannel',
                            label: 'Send to Channel',
                            icon: MessageSquare,
                            onClick: (course) => handleSendCourseToChat(course),
                            title: 'Share course details with your team'
                          },
                          {
                            key: 'delete',
                            label: 'Delete Course',
                            icon: Trash2,
                            onClick: (course) => handleDeleteCourse(course.id),
                            isDanger: true,
                            separator: true,
                            title: 'Delete this course'
                          }
                        ]}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      />
                    )}
                  </div>
                </div>

                {/* Course Content with Enhanced Layout */}
                <div className="flex">
                  {/* Left Panel - Enhanced Course Calendar */}
                  <div className="w-96 bg-white border-r border-gray-100 p-8 flex-shrink-0">
                    {/* Course Schedule Info */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 text-indigo-500 mr-2" />
                        Course Schedule
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <Clock className="w-4 h-4 mr-1.5" />
                              Duration
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex-1">
                              <span className="text-xs text-gray-500 block">Start Date</span>
                              <span className="font-semibold text-gray-900">{formatDate(course.beginDate).replace(',', '')}</span>
                            </div>
                            <div className="flex items-center justify-center px-3">
                              <ArrowRight className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="flex-1 text-right">
                              <span className="text-xs text-gray-500 block">End Date</span>
                              <span className="font-semibold text-gray-900">{formatDate(course.endDate).replace(',', '')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-500 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1.5" />
                              Progress
                            </span>
                            <span className="text-sm font-bold text-indigo-600">{course.totalDays || '6/6'}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500" style={{width: '75%'}}></div>
                          </div>
                        </div>
                        
                        {/* Course Resources */}
                        {course.sheetUrl && (
                          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-500 flex items-center">
                                <FileText className="w-4 h-4 mr-1.5" />
                                Resources
                              </span>
                            </div>
                            <a
                              href={course.sheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group w-full"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">Course Materials</span>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Course Calendar */}
                    <CourseCalendar course={course} />
                  </div>

                  {/* Right Panel - Enhanced Student List */}
                  <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Students List Header */}
                    <div className="bg-white border-b border-gray-100 px-8 py-4 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-200">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">
                            {(enrichedEnrollments[course.id] || getCourseEnrollments(course.id)).length} student{(enrichedEnrollments[course.id] || getCourseEnrollments(course.id)).length !== 1 ? 's' : ''} enrolled
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenCreateStudentForCourse(course.id)}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          Create Student
                        </button>
                      </div>
                    </div>

                    {/* Students Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                      <div className="space-y-6">
                        {/* Student Selector Section */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">Enroll Students</h4>
                            <span className="text-sm text-gray-500">
                              {(enrichedEnrollments[course.id] || getCourseEnrollments(course.id)).length} enrolled
                            </span>
                          </div>
                          
                          <StudentSelector
                            key={`student-selector-${course.id}-${(enrichedEnrollments[course.id] || getCourseEnrollments(course.id)).length}`}
                            onSelectStudent={(enrollmentData) => handleSelectExistingStudent(enrollmentData, course.id)}
                            className="w-full"
                            courseId={course.id}
                            courseName={course.courseName}
                            courseLevel={course.level}
                            classId={classData?.id}
                          />
                        </div>

                        {/* Enrolled Students List */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Students</h4>
                          {(enrichedEnrollments[course.id] || getCourseEnrollments(course.id)).length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-sm">No students enrolled in this course yet.</p>
                              <p className="text-xs text-gray-400 mt-1">Use the search above to add students.</p>
                            </div>
                          ) : (
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                              {/* Table Header */}
                              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <div className="grid grid-cols-12 gap-4">
                                  <div className="col-span-6">
                                    <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</h5>
                                  </div>
                                  <div className="col-span-4">
                                    <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment Status</h5>
                                  </div>
                                  <div className="col-span-2">
                                    <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</h5>
                                  </div>
                                </div>
                              </div>

                              {/* Table Body */}
                              <div className="divide-y divide-gray-200">
                                {(enrichedEnrollments[course.id] || getCourseEnrollments(course.id))
                                  .filter(enrollment => {
                                    // Filter out null/undefined enrollments and enrollments without required data
                                    const isValid = enrollment && (enrollment.studentName || enrollment.studentId);
                                    if (!isValid) {
                                      console.warn('Filtering out invalid enrollment:', enrollment);
                                    }
                                    return isValid;
                                  })
                                  .map((enrollment, index) => {
                                    // Generate consistent avatar color if not provided
                                    const avatarColors = [
                                      'bg-indigo-500',
                                      'bg-blue-500', 
                                      'bg-green-500',
                                      'bg-yellow-500',
                                      'bg-red-500',
                                      'bg-purple-500',
                                      'bg-pink-500',
                                      'bg-teal-500'
                                    ];
                                    
                                    const nameHash = enrollment.studentName ? 
                                      enrollment.studentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
                                    const fallbackColor = avatarColors[nameHash % avatarColors.length];
                                    
                                    const avatarInitials = enrollment.avatar || 
                                      (enrollment.studentName ? 
                                        enrollment.studentName.split(' ').map(n => n[0]).join('').toUpperCase() : 
                                        '?');

                                    const payments = enrollmentPayments[enrollment.id] || [];
                                    const latestPayment = payments.length > 0 ? payments[payments.length - 1] : null;
                                    const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
                                    const hasPayments = payments.length > 0;

                                    return (
                                      <div 
                                        key={enrollment.id} 
                                        className={`px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                        }`}
                                        onClick={() => handleOpenStudentDetails(enrollment)}
                                      >
                                        <div className="grid grid-cols-12 gap-4 items-center">
                                          {/* Student Column */}
                                          <div className="col-span-6">
                                            <div className="flex items-center space-x-3">
                                              <div 
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm ${
                                                  enrollment.avatarColor ? '' : fallbackColor
                                                }`}
                                                style={enrollment.avatarColor ? { 
                                                  backgroundColor: typeof enrollment.avatarColor === 'object' 
                                                    ? undefined 
                                                    : enrollment.avatarColor,
                                                  background: typeof enrollment.avatarColor === 'object' 
                                                    ? enrollment.avatarColor.background 
                                                    : undefined
                                                } : {}}
                                              >
                                                {avatarInitials}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                  {enrollment.studentName}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                  {enrollment.studentEmail}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Payment Status Column */}
                                          <div className="col-span-4">
                                            <div className="space-y-2">
                                              {/* Payment Status Badge */}
                                              <div className="flex items-center space-x-2">
                                                {hasPayments ? (
                                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    <CreditCard className="w-3 h-3 mr-1" />
                                                    Payment
                                                  </span>
                                                ) : (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleAddPayment(enrollment, course);
                                                    }}
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer"
                                                    title={`Add payment for ${enrollment.studentName}`}
                                                  >
                                                    <CreditCard className="w-3 h-3 mr-1" />
                                                    Add Payment
                                                  </button>
                                                )}
                                              </div>
                                              
                                              {/* Payment Amount and Details */}
                                              <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                  <DollarSign className="w-3 h-3 text-gray-400" />
                                                  <span className="text-sm font-medium text-gray-900">
                                                    {hasPayments ? formatCurrency(totalPaid, latestPayment.currency) : '₫0'}
                                                  </span>
                                                  {payments.length > 1 && (
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                      {payments.length} payments
                                                    </span>
                                                  )}
                                                </div>
                                                
                                                {/* Payment Type and Date */}
                                                {latestPayment && (
                                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span>{latestPayment.paymentType?.replace('_', ' ') || 'Payment'}</span>
                                                    {latestPayment.paymentDate && (
                                                      <>
                                                        <span>•</span>
                                                        <span>{new Date(latestPayment.paymentDate).toLocaleDateString()}</span>
                                                      </>
                                                    )}
                                                  </div>
                                                )}
                                                
                                                {/* Payment Notes */}
                                                {latestPayment?.notes && (
                                                  <p className="text-xs text-gray-500 italic truncate" title={latestPayment.notes}>
                                                    "{latestPayment.notes}"
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Actions Column */}
                                          <div className="col-span-2">
                                            <div className="flex items-center justify-end">
                                              <ActionsDropdown
                                                itemId={enrollment.id}
                                                item={enrollment}
                                                actions={[
                                                  {
                                                    key: 'addPayment',
                                                    label: 'Add Payment',
                                                    icon: CreditCard,
                                                    onClick: (enrollmentItem, e) => {
                                                      e.stopPropagation();
                                                      handleAddPayment(enrollmentItem, course);
                                                    },
                                                    title: `Add payment for ${enrollment.studentName}`
                                                  },
                                                  {
                                                    key: 'sendToChannel',
                                                    label: 'Send to Channel',
                                                    icon: MessageSquare,
                                                    onClick: (enrollmentItem, e) => {
                                                      e.stopPropagation();
                                                      handleSendToChat(enrollmentItem, course);
                                                    },
                                                    title: `Share ${enrollment.studentName}'s enrollment details`
                                                  },
                                                  {
                                                    key: 'removeStudent',
                                                    label: 'Remove from Course',
                                                    icon: Trash2,
                                                    onClick: (enrollmentItem, e) => {
                                                      e.stopPropagation();
                                                      handleRemoveStudent(enrollmentItem.id, enrollmentItem.studentName, course.courseName);
                                                    },
                                                    disabled: removingEnrollmentId === enrollment.id,
                                                    loading: removingEnrollmentId === enrollment.id,
                                                    loadingLabel: 'Removing...',
                                                    isDanger: true,
                                                    separator: true,
                                                    title: `Remove ${enrollment.studentName} from course`
                                                  }
                                                ]}
                                                disabled={removingEnrollmentId === enrollment.id}
                                                className="justify-end"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>

                              {/* Table Footer */}
                              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>
                                      {(enrichedEnrollments[course.id] || getCourseEnrollments(course.id)).length} student{(enrichedEnrollments[course.id] || getCourseEnrollments(course.id)).length !== 1 ? 's' : ''} enrolled
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span>Payment</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                      <span>No Payment</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderInfoView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (!classData) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <GraduationCap className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No class found</h3>
          <p className="mt-1 text-sm text-gray-500">
            This channel doesn't have a class linked to it yet.
          </p>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{classData.className}</h1>
                  <p className="text-sm text-gray-500">Course Overview & Statistics</p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{courses.length} Courses</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{displayStudents.length} Students</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{formatDate(classData.beginDate)} - {formatDate(classData.endDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{classData.days?.join(', ') || 'No schedule'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Left Panel - Course Statistics & Class Details */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Course Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Statistics</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Total Courses</span>
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{courses.length}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Active Courses</span>
                        <Award className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {courses.filter(c => getCourseStatus(c) === 'active').length}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Course Types</span>
                        <Globe className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {classData?.classType || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Course Levels */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Levels</h3>
                  {courses.length > 0 ? (
                    <div className="space-y-3">
                      {[...new Set(courses.map(c => c.level).filter(Boolean))].map((level, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">{level}</span>
                          <span className="text-xs text-gray-500">
                            {courses.filter(c => c.level === level).length} course{courses.filter(c => c.level === level).length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">No courses available</p>
                  )}
                </div>

                {/* Class Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Information</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Level</span>
                        <Award className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{classData.level || 'Not specified'}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Format</span>
                        <Globe className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{classData.format}</p>
                      <p className="text-xs text-gray-600 mt-1">{classData.formatOption}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Type</span>
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{classData.classType || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Teachers */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructors</h3>
                  {classData.teachers && classData.teachers.length > 0 ? (
                    <div className="space-y-3">
                      {classData.teachers.map((teacher, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {teacher.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{teacher}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">No instructors assigned</p>
                  )}
                </div>

                {/* Resources */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources</h3>
                  {classData.googleDriveUrl ? (
                    <a
                      href={classData.googleDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">Course Materials</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">No resources linked</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {getStatusBadge(getCourseStatus(classData))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Overview */}
            <div className="flex-1 flex flex-col">
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">Class Overview</h2>
                <p className="text-sm text-gray-500">Summary of class performance and statistics</p>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-white p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Courses:</span>
                        <span className="text-sm font-medium text-gray-900">{courses.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Courses:</span>
                        <span className="text-sm font-medium text-emerald-700">{courses.filter(c => getCourseStatus(c) === 'active').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Planning Courses:</span>
                        <span className="text-sm font-medium text-yellow-700">{courses.filter(c => getCourseStatus(c) === 'planning').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed Courses:</span>
                        <span className="text-sm font-medium text-gray-700">{courses.filter(c => getCourseStatus(c) === 'completed').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Course Levels:</span>
                        <span className="text-sm font-medium text-gray-900">{[...new Set(courses.map(c => c.level).filter(Boolean))].length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Student Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Students:</span>
                        <span className="text-sm font-medium text-gray-900">{displayStudents.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Students:</span>
                        <span className="text-sm font-medium text-gray-900">{displayStudents.filter(s => s.status === 'active').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Progress:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {displayStudents.length > 0 ? Math.round(displayStudents.reduce((acc, s) => acc + s.progress, 0) / displayStudents.length) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSubTabContent = () => {
    const currentSubTab = subTab || 'courses';
    
    switch (currentSubTab) {
      case 'info':
        return renderInfoView();
      
      case 'courses':
      default:
        return renderCoursesView();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Classes Sub-tabs */}
      <div className="flex items-center px-6 border-b bg-gray-50 flex-shrink-0">
        {classesSubTabs.map((tab) => {
          const subTabUrl = generateChannelUrl(channelId, 'classes', tab.id);
          const middleClickHandlers = getMiddleClickHandlers(
            subTabUrl,
            () => onSubTabSelect(tab.id)
          );

          return (
            <button
              key={tab.id}
              onClick={() => onSubTabSelect(tab.id)}
              {...middleClickHandlers}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                (subTab || 'courses') === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Classes Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {renderSubTabContent()}
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setAutoEnrollCourseId(null); // Reset auto-enroll course when modal is closed
        }}
        onSubmit={autoEnrollCourseId ? handleCreateStudentForCourse : handleAddStudent}
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && handleCancelDelete()}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-out scale-100 animate-in slide-in-from-bottom-4 zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Remove Student</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <p className="text-gray-700 leading-relaxed">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-gray-900">{confirmDelete.studentName}</span>{' '}
                from{' '}
                <span className="font-semibold text-gray-900">{confirmDelete.courseName}</span>?
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex items-center justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                disabled={removingEnrollmentId === confirmDelete.enrollmentId}
                autoFocus
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={removingEnrollmentId === confirmDelete.enrollmentId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {removingEnrollmentId === confirmDelete.enrollmentId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Student</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={showCreateCourse}
        onClose={() => {
          setShowCreateCourse(false);
          setEditingCourse(null);
        }}
        onCreate={handleCourseCreated}
        channelName={activeChannel?.name}
        channelId={channelId}
        initialData={editingCourse}
        isEditing={!!editingCourse}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentModalData(null);
        }}
        onSubmit={handlePaymentSubmit}
        title="Add Payment for Student"
        description="Record a payment for this student's course enrollment"
        currency="VND"
        prefilledData={paymentModalData}
        readOnlyFields={['studentId', 'courseId']}
        submitButtonText="Record Payment"
      />

      {/* Student Details Modal */}
      <StudentDetailsModal
        enrollment={selectedEnrollment}
        isOpen={showStudentDetailsModal}
        onClose={handleCloseStudentDetails}
      />

      {/* Payment Success Toast */}
      {paymentSuccessToast.isVisible && (
        <PaymentSuccessToast
          isVisible={paymentSuccessToast.isVisible}
          onDismiss={() => setPaymentSuccessToast({
            isVisible: false,
            autoEnrolled: false,
            studentName: '',
            courseName: '',
            amount: 0,
            currency: 'VND'
          })}
          autoEnrolled={paymentSuccessToast.autoEnrolled}
          studentName={paymentSuccessToast.studentName}
          courseName={paymentSuccessToast.courseName}
          amount={paymentSuccessToast.amount}
          currency={paymentSuccessToast.currency}
        />
      )}

      {/* Course Navigation Component */}
      {classData && courses.length > 1 && (subTab || 'courses') === 'courses' && (
        <CourseNavigationDots
          courses={courses}
          activeCourseIndex={activeCourseIndex}
          onCourseSelect={scrollToCourse}
        />
      )}

      {/* Send to Chat Modal */}
      <SendCourseStudentToChatModal
        isOpen={showSendToChatModal}
        onClose={handleCloseSendToChat}
        enrollment={sendToChatData?.enrollment}
        course={sendToChatData?.course}
        payments={sendToChatData?.payments}
      />

      {/* Send Course to Chat Modal */}
      <SendCourseToChatModal
        isOpen={showSendCourseToChatModal}
        onClose={handleCloseSendCourseToChat}
        course={courseToChatData?.course}
        classData={courseToChatData?.classData}
        enrollments={courseToChatData?.enrollments}
      />
    </div>
  );
};

/**
 * CourseCalendar - Mini calendar component for course days
 */
const CourseCalendar = ({ course }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse course dates - memoize to prevent infinite re-renders
  const startDate = useMemo(() => {
    return course.beginDate ? new Date(course.beginDate) : null;
  }, [course.beginDate]);
  
  const endDate = useMemo(() => {
    return course.endDate ? new Date(course.endDate) : null;
  }, [course.endDate]);
  
  const courseDays = course.days || [];

  // Convert day names to day numbers (0 = Sunday, 1 = Monday, etc.)
  const dayNameToNumber = {
    'Sun': 0, 'Sunday': 0,
    'Mon': 1, 'Monday': 1,
    'Tue': 2, 'Tuesday': 2,
    'Wed': 3, 'Wednesday': 3,
    'Thu': 4, 'Thursday': 4,
    'Fri': 5, 'Friday': 5,
    'Sat': 6, 'Saturday': 6
  };

  const courseDayNumbers = courseDays.map(day => dayNameToNumber[day]).filter(num => num !== undefined);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startCalendar = new Date(firstDay);
    
    // Adjust for Monday-first week (getDay() returns 0 for Sunday, 1 for Monday, etc.)
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), go back 6 days to Monday
    startCalendar.setDate(startCalendar.getDate() - daysToSubtract);

    const days = [];
    const current = new Date(startCalendar);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const isCurrentMonth = current.getMonth() === month;
      const isCourseDayOfWeek = courseDayNumbers.includes(current.getDay());
      const isInCourseRange = startDate && endDate && 
        current >= startDate && current <= endDate;
      const isCourseDay = isCurrentMonth && isCourseDayOfWeek && isInCourseRange;
      const isToday = current.toDateString() === new Date().toDateString();

      days.push({
        date: new Date(current),
        day: current.getDate(),
        isCurrentMonth,
        isCourseDay,
        isToday
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  // Set initial month to course start date if available
  useEffect(() => {
    if (startDate && !isExpanded) {
      setCurrentMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
    }
  }, [startDate, isExpanded]);

  if (!startDate || !endDate || courseDays.length === 0) {
    return (
      <div className="w-64 bg-gray-50 rounded-lg p-4 text-center">
        <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-xs text-gray-500">No schedule available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-indigo-600" />
          </button>
          
          <div className="text-center">
            <h4 className="text-sm font-bold text-indigo-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h4>
            <p className="text-xs text-indigo-600 font-medium">
              {courseDays.join(', ')}
            </p>
          </div>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors duration-200"
          >
            <ChevronRight className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
            // Map day letters to full day names for comparison
            const dayMap = {
              'M': 'Mon',
              'T': index === 1 ? 'Tue' : 'Thu', // First T is Tuesday, second T is Thursday
              'W': 'Wed',
              'F': 'Fri',
              'S': index === 5 ? 'Sat' : 'Sun' // First S is Saturday, last S is Sunday
            };
            
            const dayName = dayMap[day];
            const isCourseDay = courseDays.includes(dayName);
            
            return (
              <div 
                key={index} 
                className={`
                  text-center text-xs font-semibold py-2 rounded-lg transition-all duration-300 ease-out
                  ${isCourseDay 
                    ? 'text-indigo-600 bg-indigo-50/70 border border-indigo-200/50 shadow-sm backdrop-blur-sm' 
                    : 'text-gray-500'
                  }
                `}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                text-center text-sm py-2 rounded-lg transition-all duration-200 cursor-pointer
                ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'}
                ${day.isCourseDay ? 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-800 font-bold shadow-sm hover:shadow-md' : ''}
                ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}
              `}
            >
              {day.day}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-6 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full"></div>
              <span className="text-gray-600 font-medium">Course days</span>
            </div>
            {calendarDays.some(day => day.isToday) && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 border-2 border-indigo-500 rounded-full"></div>
                <span className="text-gray-600 font-medium">Today</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 