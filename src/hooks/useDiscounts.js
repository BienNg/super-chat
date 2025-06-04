import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

export const useDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('discounts')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setDiscounts(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching discounts:', err);
        setError(err.message);
        setDiscounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();

    const subscription = supabase
      .channel('public:discounts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discounts' },
        (payload) => {
          fetchDiscounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const addDiscount = async (discountData) => {
    try {
      const { data, error } = await supabase
        .from('discounts')
        .insert([
          {
        ...discountData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      return data ? data[0] : null;
    } catch (err) {
      console.error('Error adding discount:', err);
      throw err;
    }
  };

  const updateDiscount = async (discountId, updates) => {
    try {
      const { error } = await supabase
        .from('discounts')
        .update({
        ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', discountId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating discount:', err);
      throw err;
    }
  };

  const deleteDiscount = async (discountId) => {
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting discount:', err);
      throw err;
    }
  };

  return {
    discounts,
    loading,
    error,
    addDiscount,
    updateDiscount,
    deleteDiscount,
  };
}; 