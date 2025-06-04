import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key are required.');
}

// Create Supabase client with options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    timeout: 30000, // Increase timeout for realtime connection (default is 10000)
    params: {
      eventsPerSecond: 10 // Reduce the events per second to avoid rate limiting
    }
  },
  // Enable auto-refresh of auth tokens for longer sessions
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
}); 