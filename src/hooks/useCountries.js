import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useCountries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('countries')
        .select('*');

      if (error) {
        throw error;
      }

      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchCountries(); 
  }, [fetchCountries]);

  const addCountry = async (country) => {
    try {
      const trimmedCountry = country.trim();
      const exists = countries.some(existingCountry => 
        existingCountry.value.toLowerCase() === trimmedCountry.toLowerCase()
      );
      
      if (exists) {
        throw new Error(`Country "${trimmedCountry}" already exists`);
      }
      
      const { data, error } = await supabase
        .from('countries')
        .insert([{ value: trimmedCountry }])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Add to local state immediately
      const newCountry = data[0];
      setCountries(prev => [...prev, newCountry]);
      
      return newCountry;
    } catch (error) {
      console.error('Error adding country:', error);
      throw error;
    }
  };

  const deleteCountry = async (id) => {
    try {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setCountries(prev => prev.filter(country => country.id !== id));
    } catch (error) {
      console.error('Error deleting country:', error);
      throw error;
    }
  };

  return { 
    countries: countries.map(country => country.value), 
    loading, 
    addCountry, 
    deleteCountry 
  };
} 