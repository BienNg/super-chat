import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchCategories(); 
  }, [fetchCategories]);

  const addCategory = async (category) => {
    try {
      const trimmedCategory = category.trim();
      const exists = categories.some(existingCategory => 
        existingCategory.value.toLowerCase() === trimmedCategory.toLowerCase()
      );
      
      if (exists) {
        throw new Error(`Category "${trimmedCategory}" already exists`);
      }
      
      const docRef = await addDoc(collection(db, 'categories'), { value: trimmedCategory });
      
      // Add to local state immediately
      const newCategory = { id: docRef.id, value: trimmedCategory };
      setCategories(prev => [...prev, newCategory]);
      
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(prev => prev.filter(category => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  return { 
    categories: categories.map(category => category.value), 
    loading, 
    addCategory, 
    deleteCategory 
  };
} 