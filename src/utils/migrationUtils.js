import { supabase } from './supabaseClient';

/**
 * Migration utility to transition from classStudents to enrollments collection
 */
export const migrationUtils = {
  
  /**
   * Migrate data from classStudents to enrollments table
   * This function should be run once to migrate existing data
   */
  async migrateClassStudentsToEnrollments() {
    try {
      console.log('Starting migration from classStudents to enrollments...');
      
      // Get all records from classStudents table
      const { data: classStudents, error: fetchError } = await supabase
        .from('class_students')
        .select('*');
      
      if (fetchError) {
        console.error('Error fetching class_students:', fetchError);
        throw fetchError;
      }
      
      const migrationResults = {
        total: classStudents?.length || 0,
        successful: 0,
        failed: 0,
        errors: []
      };
      
      for (const classStudent of classStudents || []) {
        try {
          // Get additional data from referenced tables if available
          let studentData = {};
          let classData = {};
          let courseData = {};
          
          // Try to get student data if studentId exists
          if (classStudent.student_id) {
            try {
              const { data: student, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('id', classStudent.student_id)
                .single();
              
              if (studentError) throw studentError;
              if (student) studentData = student;
            } catch (err) {
              console.warn('Could not fetch student data for:', classStudent.student_id);
            }
          }
          
          // Try to get class data if classId exists
          if (classStudent.class_id) {
            try {
              const { data: classRecord, error: classError } = await supabase
                .from('classes')
                .select('*')
                .eq('id', classStudent.class_id)
                .single();
              
              if (classError) throw classError;
              if (classRecord) classData = classRecord;
            } catch (err) {
              console.warn('Could not fetch class data for:', classStudent.class_id);
            }
          }
          
          // Create enrollment record with proper structure
          const enrollmentData = {
            // References
            student_id: classStudent.student_id || null,
            course_id: classStudent.course_id || null, // May not exist in old data
            class_id: classStudent.class_id || null,
            
            // Denormalized student data
            student_name: classStudent.name || studentData.name || '',
            student_email: classStudent.email || studentData.email || '',
            
            // Denormalized course data (may be limited in old data)
            course_name: classStudent.course_name || courseData.course_name || classData.class_name || '',
            course_level: classStudent.course_level || courseData.level || classData.level || '',
            
            // Denormalized class data
            class_name: classStudent.class_name || classData.class_name || '',
            
            // Enrollment specific data
            status: classStudent.status || 'active',
            progress: classStudent.progress || 0,
            attendance: classStudent.attendance || 0,
            grade: classStudent.grade || null,
            
            // Payment information
            amount: classStudent.amount || 0,
            currency: classStudent.currency || 'VND',
            payment_status: classStudent.payment_status || 'pending',
            
            // Dates
            enrollment_date: classStudent.enrollment_date || classStudent.created_at || new Date().toISOString(),
            start_date: classStudent.start_date || null,
            end_date: classStudent.end_date || null,
            completion_date: classStudent.completion_date || null,
            
            // Additional information
            notes: classStudent.notes || '',
            
            // Avatar data
            avatar: classStudent.avatar || '',
            avatar_color: classStudent.avatar_color || null,
            
            // Metadata
            created_at: classStudent.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: classStudent.created_by || null,
            
            // Migration metadata
            migrated_from: 'class_students',
            original_id: classStudent.id,
            migration_date: new Date().toISOString()
          };
          
          // Add to enrollments table
          const { error: insertError } = await supabase
            .from('enrollments')
            .insert(enrollmentData);
          
          if (insertError) throw insertError;
          
          migrationResults.successful++;
          console.log(`Migrated record ${migrationResults.successful}/${migrationResults.total}`);
          
        } catch (error) {
          migrationResults.failed++;
          migrationResults.errors.push({
            docId: classStudent.id,
            error: error.message
          });
          console.error('Error migrating record:', classStudent.id, error);
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
      const { count: classStudentsCount, error: classError } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true });
      
      if (classError) throw classError;
      
      const { count: enrollmentsCount, error: enrollError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });
      
      if (enrollError) throw enrollError;
      
      return {
        classStudentsCount: classStudentsCount || 0,
        enrollmentsCount: enrollmentsCount || 0,
        migrationNeeded: (classStudentsCount || 0) > 0 && (enrollmentsCount || 0) === 0,
        migrationRecommended: (classStudentsCount || 0) > (enrollmentsCount || 0)
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
    const requiredFields = ['student_id', 'student_name'];
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
      student_id: 'sample-student-id',
      course_id: 'sample-course-id',
      class_id: 'sample-class-id',
      student_name: 'John Doe',
      student_email: 'john.doe@example.com',
      course_name: 'Sample Course',
      course_level: 'Beginner',
      class_name: 'Sample Class',
      status: 'active',
      progress: 0,
      attendance: 0,
      amount: 1000000,
      currency: 'VND',
      payment_status: 'pending',
      notes: 'Sample enrollment for testing',
      ...overrides
    };
  }
}; 