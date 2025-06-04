import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'cities'));
      const citiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCities(citiesData);
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
      
      const docRef = await addDoc(collection(db, 'cities'), { value: trimmedCity });
      
      // Add to local state immediately
      const newCity = { id: docRef.id, value: trimmedCity };
      setCities(prev => [...prev, newCity]);
      
      return newCity;
    } catch (error) {
      console.error('Error adding city:', error);
      throw error;
    }
  };

  const deleteCity = async (id) => {
    try {
      await deleteDoc(doc(db, 'cities', id));
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