import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Import Supabase client

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('accounts')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setAccounts(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError(err.message);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();

    // Set up a real-time listener for changes to the 'accounts' table
    const subscription = supabase
      .channel('public:accounts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts' },
        (payload) => {
          // console.log('Change received!', payload);
          fetchAccounts(); // Refetch accounts on any change
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const addAccount = async (accountData) => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert([
          {
        ...accountData,
            created_at: new Date().toISOString(), // Supabase uses created_at by default
            updated_at: new Date().toISOString(), // Supabase uses updated_at by default
          },
        ])
        .select(); // Return the inserted row

      if (error) throw error;
      return data ? data[0] : null; // Return the new account with its ID
    } catch (err) {
      console.error('Error adding account:', err);
      throw err;
    }
  };

  const updateAccount = async (accountId, updates) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
        ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating account:', err);
      throw err;
    }
  };

  const deleteAccount = async (accountId) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting account:', err);
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
  };
}; 