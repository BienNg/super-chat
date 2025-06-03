import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function usePlatforms() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlatforms = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'platforms'));
      const platformsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlatforms(platformsData);
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
      
      const docRef = await addDoc(collection(db, 'platforms'), { value: trimmedPlatform });
      
      // Add to local state immediately
      const newPlatform = { id: docRef.id, value: trimmedPlatform };
      setPlatforms(prev => [...prev, newPlatform]);
      
      return newPlatform;
    } catch (error) {
      console.error('Error adding platform:', error);
      throw error;
    }
  };

  const deletePlatform = async (id) => {
    try {
      await deleteDoc(doc(db, 'platforms', id));
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