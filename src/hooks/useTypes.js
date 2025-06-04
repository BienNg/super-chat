import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

export function useTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTypes = useCallback(async () => {
    try {
    setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('classTypes') // Assuming Supabase table is 'classTypes'
        .select('id, value'); // Assuming fields are 'id' and 'value'
      
      if (fetchError) throw fetchError;
      setTypes(data || []);
    } catch (err) {
      console.error('Error fetching types:', err);
      setError('Failed to fetch types: ' + err.message);
      setTypes([]);
    } finally {
    setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchTypes(); 

    const typeSubscription = supabase
      .channel('public:classTypes') // Unique channel name
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classTypes' }, 
        () => fetchTypes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(typeSubscription);
    };
  }, [fetchTypes]);

  const addType = async (typeName) => {
    try {
      setError(null);
      const trimmedType = typeName.trim();
      
      const { data: existingType, error: checkError } = await supabase
        .from('classTypes')
        .select('id')
        .ilike('value', trimmedType) // Case-insensitive match
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116: 0 rows, fine
        throw checkError;
      }
      if (existingType) {
        throw new Error(`Type "${trimmedType}" already exists.`);
    }
    
      const { data: newType, error: insertError } = await supabase
        .from('classTypes')
        .insert({ value: trimmedType })
        .select('id, value') // Return the new type
        .single();

      if (insertError) throw insertError;
      return newType; // Real-time listener will update the main state
    } catch (err) {
      console.error('Error adding type:', err);
      setError('Failed to add type: ' + err.message);
      throw err; 
    }
  };

  const deleteType = async (id) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('classTypes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      // Real-time listener will update the main state
    } catch (err) {
      console.error('Error deleting type:', err);
      setError('Failed to delete type: ' + err.message);
      throw err;
    }
  };

  return { 
    types: types.map(type => type.value), // Return array of string values
    typesWithIds: types, // Return array of {id, value} objects
    loading, 
    error, 
    addType, 
    deleteType 
  };
} 