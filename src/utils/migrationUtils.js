import { 
  collection, 
  query, 
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Migration utility to transition from classStudents to enrollments collection
 */
export const migrationUtils = {
  
  /**
   * Migrate data from classStudents collection to enrollments collection
   * This function should be run once to migrate existing data
   */
  async migrateClassStudentsToEnrollments() {
    try {
      console.log('Starting migration from classStudents to enrollments...');
      
      // Get all documents from classStudents collection
      const classStudentsQuery = query(collection(db, 'classStudents'));
      const classStudentsSnapshot = await getDocs(classStudentsQuery);
      
      const migrationResults = {
        total: classStudentsSnapshot.docs.length,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      for (const classStudentDoc of classStudentsSnapshot.docs) {
        try {
          const classStudentData = classStudentDoc.data();
          
          // Get additional data from referenced collections if available
          let studentData = {};
          let classData = {};
          let courseData = {};
          
          // Try to get student data if studentId exists
          if (classStudentData.studentId) {
            try {
              const studentDoc = await getDoc(doc(db, 'students', classStudentData.studentId));
              if (studentDoc.exists()) {
                studentData = studentDoc.data();
              }
            } catch (err) {
              console.warn('Could not fetch student data for:', classStudentData.studentId);
            }
          }
          
          // Try to get class data if classId exists
          if (classStudentData.classId) {
            try {
              const classDoc = await getDoc(doc(db, 'classes', classStudentData.classId));
              if (classDoc.exists()) {
                classData = classDoc.data();
              }
            } catch (err) {
              console.warn('Could not fetch class data for:', classStudentData.classId);
            }
          }
          
          // Create enrollment record with proper structure
          const enrollmentData = {
            // References
            studentId: classStudentData.studentId || null,
            courseId: classStudentData.courseId || null, // May not exist in old data
            classId: classStudentData.classId || null,
            
            // Denormalized student data
            studentName: classStudentData.name || studentData.name || '',
            studentEmail: classStudentData.email || studentData.email || '',
            
            // Denormalized course data (may be limited in old data)
            courseName: classStudentData.courseName || courseData.courseName || classData.className || '',
            courseLevel: classStudentData.courseLevel || courseData.level || classData.level || '',
            
            // Denormalized class data
            className: classStudentData.className || classData.className || '',
            
            // Enrollment specific data
            status: classStudentData.status || 'active',
            progress: classStudentData.progress || 0,
            attendance: classStudentData.attendance || 0,
            grade: classStudentData.grade || null,
            
            // Payment information
            amount: classStudentData.amount || 0,
            currency: classStudentData.currency || 'VND',
            paymentStatus: classStudentData.paymentStatus || 'pending',
            
            // Dates
            enrollmentDate: classStudentData.enrollmentDate || classStudentData.createdAt || serverTimestamp(),
            startDate: classStudentData.startDate || null,
            endDate: classStudentData.endDate || null,
            completionDate: classStudentData.completionDate || null,
            
            // Additional information
            notes: classStudentData.notes || '',
            
            // Avatar data
            avatar: classStudentData.avatar || '',
            avatarColor: classStudentData.avatarColor || null,
            
            // Metadata
            createdAt: classStudentData.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: classStudentData.createdBy || null,
            
            // Migration metadata
            migratedFrom: 'classStudents',
            originalId: classStudentDoc.id,
            migrationDate: serverTimestamp()
          };
          
          // Add to enrollments collection
          await addDoc(collection(db, 'enrollments'), enrollmentData);
          
          migrationResults.successful++;
          console.log(`Migrated record ${migrationResults.successful}/${migrationResults.total}`);
          
        } catch (error) {
          migrationResults.failed++;
          migrationResults.errors.push({
            docId: classStudentDoc.id,
            error: error.message
          });
          console.error('Error migrating document:', classStudentDoc.id, error);
        }
      }
      
      console.log('Migration completed:', migrationResults);
      return migrationResults;
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },
  
  /**
   * Check if migration is needed by comparing record counts
   */
  async checkMigrationStatus() {
    try {
      const classStudentsSnapshot = await getDocs(collection(db, 'classStudents'));
      const enrollmentsSnapshot = await getDocs(collection(db, 'enrollments'));
      
      const classStudentsCount = classStudentsSnapshot.docs.length;
      const enrollmentsCount = enrollmentsSnapshot.docs.length;
      
      return {
        classStudentsCount,
        enrollmentsCount,
        migrationNeeded: classStudentsCount > 0 && enrollmentsCount === 0,
        migrationRecommended: classStudentsCount > enrollmentsCount
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      throw error;
    }
  },
  
  /**
   * Validate enrollment data structure
   */
  validateEnrollmentData(enrollmentData) {
    const requiredFields = ['studentId', 'studentName'];
    const missingFields = requiredFields.filter(field => !enrollmentData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate status
    const validStatuses = ['active', 'completed', 'dropped', 'suspended'];
    if (enrollmentData.status && !validStatuses.includes(enrollmentData.status)) {
      throw new Error(`Invalid status: ${enrollmentData.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Validate progress and attendance
    if (enrollmentData.progress && (enrollmentData.progress < 0 || enrollmentData.progress > 100)) {
      throw new Error('Progress must be between 0 and 100');
    }
    
    if (enrollmentData.attendance && (enrollmentData.attendance < 0 || enrollmentData.attendance > 100)) {
      throw new Error('Attendance must be between 0 and 100');
    }
    
    return true;
  },
  
  /**
   * Create a sample enrollment for testing
   */
  createSampleEnrollment(overrides = {}) {
    return {
      studentId: 'sample-student-id',
      courseId: 'sample-course-id',
      classId: 'sample-class-id',
      studentName: 'John Doe',
      studentEmail: 'john.doe@example.com',
      courseName: 'Sample Course',
      courseLevel: 'Beginner',
      className: 'Sample Class',
      status: 'active',
      progress: 0,
      attendance: 0,
      amount: 1000000,
      currency: 'VND',
      paymentStatus: 'pending',
      notes: 'Sample enrollment for testing',
      ...overrides
    };
  }
}; 