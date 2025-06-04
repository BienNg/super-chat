import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCourseInterests() {
  const [courseInterests, setCourseInterests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourseInterests = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'courseInterests'));
      const interests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourseInterests(interests);
    } catch (error) {
      console.error('Error fetching course interests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchCourseInterests(); 
  }, [fetchCourseInterests]);

  const addCourseInterest = async (interest) => {
    try {
      const trimmedInterest = interest.trim();
      const exists = courseInterests.some(existingInterest => 
        existingInterest.value.toLowerCase() === trimmedInterest.toLowerCase()
      );
      
      if (exists) {
        throw new Error(`Course interest "${trimmedInterest}" already exists`);
      }
      
      const docRef = await addDoc(collection(db, 'courseInterests'), { value: trimmedInterest });
      
      // Add to local state immediately
      const newInterest = { id: docRef.id, value: trimmedInterest };
      setCourseInterests(prev => [...prev, newInterest]);
      
      return newInterest;
    } catch (error) {
      console.error('Error adding course interest:', error);
      throw error;
    }
  };

  const deleteCourseInterest = async (id) => {
    try {
      await deleteDoc(doc(db, 'courseInterests', id));
      setCourseInterests(prev => prev.filter(interest => interest.id !== id));
    } catch (error) {
      console.error('Error deleting course interest:', error);
      throw error;
    }
  };

  return { 
    courseInterests: courseInterests.map(interest => interest.value), 
    loading, 
    addCourseInterest, 
    deleteCourseInterest 
  };
} 