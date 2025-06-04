import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

export function useLevels() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLevels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('class_levels') // Assuming Supabase table is 'class_levels'
        .select('id, value') // Assuming fields are 'id' and 'value'
        .order('value', { ascending: true }); // Optional: order them
      
      if (fetchError) throw fetchError;
      setLevels(data || []);
    } catch (err) {
      console.error('Error fetching class levels:', err);
      setError('Failed to fetch class levels: ' + err.message);
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchLevels();

    // Real-time subscription
    const levelSubscription = supabase
      .channel('public:class_levels') // Unique channel name
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_levels' }, 
        (payload) => {
          // console.log('Class levels change received!', payload);
          fetchLevels(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(levelSubscription);
    };
  }, [fetchLevels]);

  const addLevel = async (levelValue) => {
    try {
      setError(null);
      const trimmedLevel = levelValue.trim();
      
      // Client-side duplicate check (case-insensitive)
      const exists = levels.some(existingLevel => 
        existingLevel.value.toLowerCase() === trimmedLevel.toLowerCase()
      );
      if (exists) {
        // To provide a more immediate feedback, we can throw here.
        // The server-side check below is for robustness.
        // throw new Error(`Level "${trimmedLevel}" already exists (client check)`);
      }
      
      // Server-side duplicate check (more robust)
      const { data: existingInDb, error: checkError } = await supabase
        .from('class_levels')
        .select('id')
        .ilike('value', trimmedLevel) // Case-insensitive search
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for insert
          throw checkError;
      }
      if (existingInDb) {
        throw new Error(`Level "${trimmedLevel}" already exists.`);
      }

      const { data: newLevel, error: insertError } = await supabase
        .from('class_levels')
        .insert({ value: trimmedLevel })
        .select('id, value') // Return the inserted row
        .single();

      if (insertError) throw insertError;
      // Real-time subscription should update the list automatically.
      // Explicitly calling fetchLevels() is usually not needed here.
      return newLevel;
    } catch (err) {
      console.error('Error adding level:', err);
      setError('Failed to add level: ' + err.message);
      throw err; 
    }
  };

  const deleteLevel = async (id) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('class_levels')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      // Real-time subscription should update the list automatically.
    } catch (err) {
      console.error('Error deleting level:', err);
      setError('Failed to delete level: ' + err.message);
      throw err; 
    }
  };

  return { 
    levels, // This will be an array of {id, value} objects
    loading, 
    error, 
    addLevel, 
    deleteLevel 
  };
} 