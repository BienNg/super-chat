import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client
import { useAuth } from '../contexts/AuthContext';

// Helper to convert potential Supabase timestamp strings to Date objects
const toDateSafe = (timestamp) => {
  if (!timestamp) return new Date(); // Or null, depending on desired behavior for missing dates
  if (timestamp instanceof Date) return timestamp;
  const parsedDate = new Date(timestamp);
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

export const useCourses = (classId = null) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { currentUser } = useAuth(); // Assuming useAuth provides Supabase user with user.id

    const fetchCourses = useCallback(async () => {
        if (!currentUser?.id) {
            setCourses([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            let query = supabase.from('courses').select('*');

            if (classId) {
                query = query.eq('class_id', classId); // snake_case for Supabase column
            }
            query = query.order('created_at', { ascending: false }); // snake_case
            
            const { data, error: fetchError } = await query;
            if (fetchError) throw fetchError;

            const coursesData = (data || []).map(course => ({
                ...course,
                // Ensure date fields are Date objects and use snake_case consistently
                created_at: toDateSafe(course.created_at),
                updated_at: toDateSafe(course.updated_at),
                begin_date: course.begin_date ? toDateSafe(course.begin_date) : null, // Handle optional dates
                end_date: course.end_date ? toDateSafe(course.end_date) : null,
            }));
            
            setCourses(coursesData);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Failed to fetch courses: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id, classId]);

    useEffect(() => {
        fetchCourses();

        if (!currentUser?.id) return;

        const coursesSubscription = supabase
            .channel('public:courses')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'courses' },
                (payload) => {
                    // console.log('Courses change received:', payload);
                    fetchCourses(); // Refetch on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(coursesSubscription);
        };
    }, [fetchCourses, currentUser?.id]); // Added currentUser?.id to dependencies

    const createCourse = async (courseData, class_id, channel_id = null) => {
        if (!currentUser?.id || !class_id) {
            setError('User not authenticated or class ID missing');
            throw new Error('User not authenticated or class ID missing');
        }
        try {
            setError(null);
            const now = new Date().toISOString();
            const newCourseData = {
                class_id, // snake_case
                channel_id, // snake_case
                course_name: courseData.courseName,
                sheet_url: courseData.sheetUrl || '',
                teachers: courseData.teachers || [],
                level: courseData.level || '',
                begin_date: courseData.beginDate || null,
                end_date: courseData.endDate || null,
                days: courseData.days || [],
                total_days: courseData.totalDays || null,
                status: 'active',
                created_at: now,
                updated_at: now,
                created_by: currentUser.id
            };
            
            const { data: createdCourse, error: insertError } = await supabase
                .from('courses')
                .insert(newCourseData)
                .select()
                .single();
            
            if (insertError) throw insertError;
            // fetchCourses(); // Real-time listener should handle this
            return createdCourse;
        } catch (err) {
            console.error('Error creating course:', err);
            setError('Failed to create course: ' + err.message);
            throw err;
        }
    };

    const updateCourse = async (courseId, updates) => {
        if (!currentUser?.id) {
             setError('User not authenticated');
             throw new Error('User not authenticated');
        }
        try {
            setError(null);
            // Convert camelCase keys from updates to snake_case for Supabase
            const updatesForSupabase = { ...updates };
            if (updates.courseName) { updatesForSupabase.course_name = updates.courseName; delete updatesForSupabase.courseName; }
            if (updates.sheetUrl) { updatesForSupabase.sheet_url = updates.sheetUrl; delete updatesForSupabase.sheetUrl; }
            if (updates.beginDate) { updatesForSupabase.begin_date = updates.beginDate; delete updatesForSupabase.beginDate; }
            if (updates.endDate) { updatesForSupabase.end_date = updates.endDate; delete updatesForSupabase.endDate; }
            if (updates.totalDays) { updatesForSupabase.total_days = updates.totalDays; delete updatesForSupabase.totalDays; }


            const { data: updatedCourse, error: updateError } = await supabase
                .from('courses')
                .update({ ...updatesForSupabase, updated_at: new Date().toISOString() })
                .eq('id', courseId)
                .select()
                .single();
            
            if (updateError) throw updateError;
            // fetchCourses(); // Real-time listener should handle this
            return updatedCourse;
        } catch (err) {
            console.error('Error updating course:', err);
            setError('Failed to update course: ' + err.message);
            throw err;
        }
    };

    const deleteCourse = async (courseId) => {
        if (!currentUser?.id) {
             setError('User not authenticated');
             throw new Error('User not authenticated');
        }
        try {
            setError(null);
            
            const { data: courseToDelete, error: fetchError } = await supabase
                .from('courses')
                .select('id, class_id, course_name')
                .eq('id', courseId)
                .single();
            
            if (fetchError || !courseToDelete) {
                throw new Error(fetchError?.message || 'Course not found');
            }
            
            const class_id_of_deleted_course = courseToDelete.class_id;
            
            // Check active courses for this class (excluding the one being deleted)
            const { data: otherCoursesInClass, error: otherCoursesError } = await supabase
                .from('courses')
                .select('id, status')
                .eq('class_id', class_id_of_deleted_course)
                .not('id', 'eq', courseId);

            if (otherCoursesError) throw otherCoursesError;

            const activeCoursesRemaining = (otherCoursesInClass || []).filter(c => c.status === 'active' || !c.status).length;
            
            const { error: deleteError } = await supabase.from('courses').delete().eq('id', courseId);
            if (deleteError) throw deleteError;
            
            if (activeCoursesRemaining === 0 && class_id_of_deleted_course) {
                console.log(`🧹 Last active course deleted for class ${class_id_of_deleted_course}, initiating automatic cleanup...`);
                const cleanupFields = {
                    format: null,
                    format_option: null, // snake_case for DB
                    class_type: null,    // snake_case for DB
                    days: null,
                    updated_at: new Date().toISOString()
                    };
                    
                const { error: classUpdateError } = await supabase
                    .from('classes') // Assuming a 'classes' table
                    .update(cleanupFields)
                    .eq('id', class_id_of_deleted_course);
                
                if (classUpdateError) {
                    console.warn('⚠️ Error cleaning up class fields:', classUpdateError);
                    // Decide if this error should be surfaced to the user or just logged
                } else {
                    console.log('✅ Class fields cleaned up successfully for class:', class_id_of_deleted_course);
                }
            }
            // fetchCourses(); // Real-time should handle update
        } catch (err) {
            console.error('Error deleting course:', err);
            setError('Failed to delete course: ' + err.message);
            throw err;
        }
    };

    const archiveCourse = async (courseId) => {
        if (!currentUser?.id) {
             setError('User not authenticated');
             throw new Error('User not authenticated');
        }
        try {
            setError(null);
            const { data: archivedCourse, error: updateError } = await supabase
                .from('courses')
                .update({ status: 'archived', updated_at: new Date().toISOString() })
                .eq('id', courseId)
                .select()
                .single();
            
            if (updateError) throw updateError;
            // fetchCourses(); // Real-time should handle update
            return archivedCourse;
        } catch (err) {
            console.error('Error archiving course:', err);
            setError('Failed to archive course: ' + err.message);
            throw err;
        }
    };

    const getCourseById = useCallback(async (id) => {
        if (!id) return null;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data ? { ...data, created_at: toDateSafe(data.created_at), updated_at: toDateSafe(data.updated_at) } : null;
        } catch (err) {
            console.error(`Error fetching course by ID ${id}:`, err);
            setError('Failed to fetch course details: ' + err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies needed if supabase client doesn't change

    // queryCourses function would also need similar Supabase conversion
    // For brevity, it's omitted here but would follow the same pattern:
    // supabase.from('courses').select().match(filters)

    return {
        courses,
        loading,
        error,
        createCourse,
        updateCourse,
        deleteCourse,
        archiveCourse,
        fetchCourses, // Expose fetchCourses if manual refresh is needed
        getCourseById 
        // getCoursesByClassId is implicitly handled by passing classId to the hook
        // and the main courses state filtering if needed, or can be added explicitly if distinct logic
    };
}; 