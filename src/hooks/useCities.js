import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cities')
        .select('*');

      if (error) {
        throw error;
      }

      setCities(data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchCities(); 
  }, [fetchCities]);

  const addCity = async (city) => {
    try {
      const trimmedCity = city.trim();
      const exists = cities.some(existingCity => 
        existingCity.value.toLowerCase() === trimmedCity.toLowerCase()
      );
      
      if (exists) {
        throw new Error(`City "${trimmedCity}" already exists`);
      }
      
      const { data, error } = await supabase
        .from('cities')
        .insert([{ value: trimmedCity }])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Add to local state immediately
      const newCity = data[0];
      setCities(prev => [...prev, newCity]);
      
      return newCity;
    } catch (error) {
      console.error('Error adding city:', error);
      throw error;
    }
  };

  const deleteCity = async (id) => {
    try {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setCities(prev => prev.filter(city => city.id !== id));
    } catch (error) {
      console.error('Error deleting city:', error);
      throw error;
    }
  };

  return { 
    cities: cities.map(city => city.value), 
    loading, 
    addCity, 
    deleteCity 
  };
} 