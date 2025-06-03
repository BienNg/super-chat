import { supabase } from './supabaseClient';

export const supabaseDb = {
  // Generic database operations
  getCollection: async (tableName, orderByField = 'created_at', orderDirection = 'desc') => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(orderByField, { ascending: orderDirection === 'asc' });
    
    if (error) throw error;
    return data;
  },
  
  getById: async (tableName, id) => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  addItem: async (tableName, data) => {
    // Add timestamps similar to Firestore
    const itemWithTimestamps = {
      ...data,
      created_at: new Date().toISOString(),
    };
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(itemWithTimestamps)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },
  
  updateItem: async (tableName, id, updates) => {
    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from(tableName)
      .update(updatesWithTimestamp)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  deleteItem: async (tableName, id) => {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },
  
  // Specialized queries
  query: async (tableName, queryFn) => {
    let query = supabase.from(tableName).select('*');
    
    // Apply the query function that will chain methods like .eq(), .in(), etc.
    query = queryFn(query);
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },
  
  // Real-time subscriptions (similar to Firestore onSnapshot)
  subscribe: (tableName, callback, filters = {}) => {
    let subscription = supabase
      .channel(`${tableName}-changes`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: tableName 
      }, (payload) => {
        callback(payload);
      })
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      supabase.removeChannel(subscription);
    };
  }
}; 