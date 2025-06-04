import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

export function useCourseInterests() {
  const [courseInterests, setCourseInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourseInterests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('courseInterests') // Assuming your Supabase table is named 'courseInterests'
        .select('id, value'); // Assuming fields are 'id' and 'value'
      
      if (fetchError) throw fetchError;
      setCourseInterests(data || []);
    } catch (err) {
      console.error('Error fetching course interests:', err);
      setError('Failed to fetch course interests: ' + err.message);
      setCourseInterests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchCourseInterests(); 

    const interestSubscription = supabase
      .channel('public:courseInterests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courseInterests' },
        () => fetchCourseInterests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(interestSubscription);
    };
  }, [fetchCourseInterests]);

  const addCourseInterest = async (interestName) => {
    try {
      setError(null);
      const trimmedInterest = interestName.trim();
      
      const { data: existingInterest, error: checkError } = await supabase
        .from('courseInterests')
        .select('id')
        .ilike('value', trimmedInterest) // Case-insensitive match
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116: 0 rows
        throw checkError;
      }
      if (existingInterest) {
        throw new Error(`Course interest "${trimmedInterest}" already exists.`);
      }
      
      const { data: newInterest, error: insertError } = await supabase
        .from('courseInterests')
        .insert({ value: trimmedInterest })
        .select('id, value')
        .single();

      if (insertError) throw insertError;
      // No need to manually update state due to real-time listener
      return newInterest;
    } catch (err) {
      console.error('Error adding course interest:', err);
      setError('Failed to add course interest: ' + err.message);
      throw err;
    }
  };

  const deleteCourseInterest = async (id) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('courseInterests')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      // No need to manually update state due to real-time listener
    } catch (err) {
      console.error('Error deleting course interest:', err);
      setError('Failed to delete course interest: ' + err.message);
      throw err;
    }
  };

  return { 
    courseInterests: courseInterests.map(interest => interest.value), 
    courseInterestsWithIds: courseInterests, // Expose objects with IDs if needed
    loading, 
    error, 
    addCourseInterest, 
    deleteCourseInterest 
  };
} 