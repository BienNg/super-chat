import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCountries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'countries'));
      const countriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCountries(countriesData);
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
      
      const docRef = await addDoc(collection(db, 'countries'), { value: trimmedCountry });
      
      // Add to local state immediately
      const newCountry = { id: docRef.id, value: trimmedCountry };
      setCountries(prev => [...prev, newCountry]);
      
      return newCountry;
    } catch (error) {
      console.error('Error adding country:', error);
      throw error;
    }
  };

  const deleteCountry = async (id) => {
    try {
      await deleteDoc(doc(db, 'countries', id));
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