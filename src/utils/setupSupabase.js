import { createClient } from '@supabase/supabase-js';

/**
 * Sets up a Supabase client with the provided credentials
 * @param {string} supabaseUrl - Your Supabase project URL
 * @param {string} supabaseKey - Your Supabase anon key
 * @returns {Object} The Supabase client
 */
export function setupSupabase(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and anon key are required.');
  }
  
  // Create and return the Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
  
  console.log('Supabase client initialized successfully');
  return supabase;
}

/**
 * Tests the Supabase connection
 * @param {Object} supabase - The Supabase client
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testSupabaseConnection(supabase) {
  try {
    const { data, error } = await supabase.from('_realtime').select('*').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return false;
    }
    
    console.log('Successfully connected to Supabase!');
    return true;
  } catch (err) {
    console.error('Exception when testing Supabase connection:', err.message);
    return false;
  }
} 