import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';

/**
 * IMPORTANT: This hook requires a 'categories' table in your Supabase database.
 * 
 * If you're seeing errors about the 'categories' table not existing, you need to:
 * 1. Go to the SQL editor in your Supabase dashboard
 * 2. Copy and execute the SQL in /sql/create_categories_table.sql
 * 3. This will create the stored procedure
 * 4. Then you can call this procedure in your app code or directly via SQL:
 *    SELECT create_categories_table();
 * 
 * The hook will use default categories when the table doesn't exist to avoid app crashes.
 */

// Default categories to use when the table doesn't exist
const DEFAULT_CATEGORIES = [
  { id: 'c1', value: 'General' },
  { id: 'c2', value: 'Academic' },
  { id: 'c3', value: 'Visa' },
  { id: 'c4', value: 'Admin' },
  { id: 'c5', value: 'Financial' }
];

export function useCategories() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const errorLoggedRef = useRef(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      
      // Don't try to fetch if we already know the table is missing
      if (tableMissing) {
        return;
      }
      
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (error) {
        // Check if error is due to missing table
        if (error.code === '42P01' && !errorLoggedRef.current) {
          console.error('Categories table does not exist - using default categories:', error);
          errorLoggedRef.current = true;
          setTableMissing(true);
          return;
        }
        throw error;
      }

      setCategories(data || DEFAULT_CATEGORIES);
    } catch (error) {
      if (!errorLoggedRef.current) {
        console.error('Error fetching categories - using default categories:', error);
        errorLoggedRef.current = true;
      }
      // Use default categories on error
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [tableMissing]);

  useEffect(() => { 
    fetchCategories(); 
  }, [fetchCategories]);

  const addCategory = async (category) => {
    try {
      // If table is missing, just add to local state
      if (tableMissing) {
        const newCategory = { 
          id: `local-${Date.now()}`, 
          value: category.trim() 
        };
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      }
      
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
      // If table is missing, just update local state
      if (tableMissing) {
        setCategories(prev => prev.map(category => 
          category.id === id ? { ...category, value: newValue.trim() } : category
        ));
        return;
      }
      
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
      // If table is missing, just update local state
      if (tableMissing) {
        setCategories(prev => prev.filter(category => category.id !== id));
        return;
      }
      
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