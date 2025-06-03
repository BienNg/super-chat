import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) {
        throw error;
      }

      setCategories(data || []);
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
      
      const { data, error } = await supabase
        .from('categories')
        .insert([{ value: trimmedCategory }])
        .select();
      
      if (error) {
        throw error;
      }
      
      // Add to local state immediately
      const newCategory = data[0];
      setCategories(prev => [...prev, newCategory]);
      
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id, newValue) => {
    try {
      const trimmedValue = newValue.trim();
      const exists = categories.some(existingCategory => 
        existingCategory.value.toLowerCase() === trimmedValue.toLowerCase() && 
        existingCategory.id !== id
      );
      
      if (exists) {
        throw new Error(`Category "${trimmedValue}" already exists`);
      }
      
      const { error } = await supabase
        .from('categories')
        .update({ value: trimmedValue })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Update in local state
      setCategories(prev => prev.map(category => 
        category.id === id ? { ...category, value: trimmedValue } : category
      ));
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setCategories(prev => prev.filter(category => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  return { 
    categories: categories.map(category => category.value), 
    categoriesWithIds: categories,
    loading, 
    addCategory,
    updateCategory,
    deleteCategory 
  };
} 