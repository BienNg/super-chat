import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

export function useFunnelSteps() {
  const [funnelSteps, setFunnelSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFunnelSteps = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories') // Assuming your Supabase table is named 'categories'
        .select('id, value'); // Explicitly select fields, assuming 'value' stores the step name
      
      if (fetchError) throw fetchError;

      setFunnelSteps(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      setFunnelSteps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchFunnelSteps(); 

    const subscription = supabase
      .channel('public:categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          // console.log('Categories change received!', payload);
          fetchFunnelSteps(); // Refetch categories on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchFunnelSteps]);

  const addFunnelStep = async (stepValue) => {
    try {
      const trimmedStep = stepValue.trim();
      // Client-side check for existence (optional, can be handled by DB constraints)
      const { data: existing, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .ilike('value', trimmedStep) // Case-insensitive check
        .maybeSingle(); // Returns one row or null

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116: 0 rows
        throw checkError;
      }
      if (existing) {
        throw new Error(`Category "${trimmedStep}" already exists`);
      }
      
      const { data: newStep, error: insertError } = await supabase
        .from('categories')
        .insert({ value: trimmedStep })
        .select('id, value')
        .single(); // Expecting a single inserted row back

      if (insertError) throw insertError;
      
      // No need to manually update state if real-time listener is effective
      // setFunnelSteps(prev => [...prev, newStep]); 
      return newStep;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateFunnelStep = async (id, newValue) => {
    try {
      const trimmedValue = newValue.trim();
      // Client-side check for existence (optional)
      const { data: existing, error: checkError } = await supabase
        .from('categories')
        .select('id')
        .ilike('value', trimmedValue)
        .not('id', 'eq', id) // Exclude current item from check
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { 
        throw checkError;
      }
      if (existing) {
        throw new Error(`Category "${trimmedValue}" already exists`);
      }
      
      const { data: updatedStep, error: updateError } = await supabase
        .from('categories')
        .update({ value: trimmedValue })
        .eq('id', id)
        .select('id, value')
        .single();

      if (updateError) throw updateError;
      
      // No need to manually update state if real-time listener is effective
      // setFunnelSteps(prev => prev.map(step => 
      //   step.id === id ? { ...step, value: trimmedValue } : step
      // ));
      return updatedStep;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteFunnelStep = async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      // No need to manually update state if real-time listener is effective
      // setFunnelSteps(prev => prev.filter(step => step.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  return { 
    funnelSteps: funnelSteps.map(step => step.value), // Returns array of string values
    funnelStepsWithIds: funnelSteps, // Returns array of {id, value} objects
    loading, 
    error, // Expose error state
    addFunnelStep, 
    updateFunnelStep,
    deleteFunnelStep 
  };
} 