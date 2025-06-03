import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFunnelSteps() {
  const [funnelSteps, setFunnelSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFunnelSteps = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'categories'));
      const steps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFunnelSteps(steps);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchFunnelSteps(); 
  }, [fetchFunnelSteps]);

  const addFunnelStep = async (step) => {
    try {
      const trimmedStep = step.trim();
      const exists = funnelSteps.some(existingStep => 
        existingStep.value.toLowerCase() === trimmedStep.toLowerCase()
      );
      
      if (exists) {
        throw new Error(`Category "${trimmedStep}" already exists`);
      }
      
      const docRef = await addDoc(collection(db, 'categories'), { value: trimmedStep });
      
      // Add to local state immediately
      const newStep = { id: docRef.id, value: trimmedStep };
      setFunnelSteps(prev => [...prev, newStep]);
      
      return newStep;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateFunnelStep = async (id, newValue) => {
    try {
      const trimmedValue = newValue.trim();
      const exists = funnelSteps.some(existingStep => 
        existingStep.value.toLowerCase() === trimmedValue.toLowerCase() && existingStep.id !== id
      );
      
      if (exists) {
        throw new Error(`Category "${trimmedValue}" already exists`);
      }
      
      await updateDoc(doc(db, 'categories', id), { value: trimmedValue });
      
      // Update local state immediately
      setFunnelSteps(prev => prev.map(step => 
        step.id === id ? { ...step, value: trimmedValue } : step
      ));
      
      return { id, value: trimmedValue };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteFunnelStep = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      setFunnelSteps(prev => prev.filter(step => step.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  return { 
    funnelSteps: funnelSteps.map(step => step.value),
    funnelStepsWithIds: funnelSteps, // For the settings modal
    loading, 
    addFunnelStep, 
    updateFunnelStep,
    deleteFunnelStep 
  };
} 