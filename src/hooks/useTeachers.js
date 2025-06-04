import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

export function useTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeachers = useCallback(async () => {
    try {
    setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('teachers') // Assuming your Supabase table is named 'teachers'
        .select('id, value'); // Assuming fields are 'id' and 'value'
      
      if (fetchError) throw fetchError;
      setTeachers(data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to fetch teachers: ' + err.message);
      setTeachers([]);
    } finally {
    setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchTeachers(); 

    const teacherSubscription = supabase
      .channel('public:teachers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, 
        () => fetchTeachers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(teacherSubscription);
    };
  }, [fetchTeachers]);

  const addTeacher = async (teacherName) => {
    try {
      setError(null);
      const trimmedTeacher = teacherName.trim();
      
      // Check for duplicates in the database (case-insensitive)
      const { data: existingTeacher, error: checkError } = await supabase
        .from('teachers')
        .select('id')
        .ilike('value', trimmedTeacher) // Case-insensitive match for 'value' column
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
        throw checkError;
      }
      if (existingTeacher) {
        throw new Error(`Teacher "${trimmedTeacher}" already exists.`);
    }
    
      const { error: insertError } = await supabase
        .from('teachers')
        .insert({ value: trimmedTeacher }); // Assuming 'value' column stores the name

      if (insertError) throw insertError;
      // fetchTeachers(); // Real-time listener will update the list
    } catch (err) {
      console.error('Error adding teacher:', err);
      setError('Failed to add teacher: ' + err.message);
      // Re-throw to allow components to handle it, e.g., display a notification
      throw err; 
    }
  };

  const deleteTeacher = async (id) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      // fetchTeachers(); // Real-time listener will update the list
    } catch (err) {
      console.error('Error deleting teacher:', err);
      setError('Failed to delete teacher: ' + err.message);
      throw err;
    }
  };

  return { teachers, loading, error, addTeacher, deleteTeacher };
} 