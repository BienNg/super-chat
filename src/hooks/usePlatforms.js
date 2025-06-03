import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function usePlatforms() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlatforms = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platforms')
        .select('*');

      if (error) {
        throw error;
      }

      setPlatforms(data || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchPlatforms(); 
  }, [fetchPlatforms]);

  const addPlatform = async (platform) => {
    try {
      const trimmedPlatform = platform.trim();
      const exists = platforms.some(existingPlatform => 
        existingPlatform.value.toLowerCase() === trimmedPlatform.toLowerCase()
      );
      
      if (exists) {
        throw new Error(`Platform "${trimmedPlatform}" already exists`);
      }
      
      const { data, error } = await supabase
        .from('platforms')
        .insert([{ value: trimmedPlatform }])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Add to local state immediately
      const newPlatform = data[0];
      setPlatforms(prev => [...prev, newPlatform]);
      
      return newPlatform;
    } catch (error) {
      console.error('Error adding platform:', error);
      throw error;
    }
  };

  const deletePlatform = async (id) => {
    try {
      const { error } = await supabase
        .from('platforms')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setPlatforms(prev => prev.filter(platform => platform.id !== id));
    } catch (error) {
      console.error('Error deleting platform:', error);
      throw error;
    }
  };

  return { 
    platforms: platforms.map(platform => platform.value), 
    loading, 
    addPlatform, 
    deletePlatform 
  };
} 