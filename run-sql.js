// This script runs SQL commands on your Supabase database using the REST API
const https = require('https');

// SQL command to drop user_profiles and ensure profiles table exists
const sqlContent = `
-- Drop the user_profiles table if it exists
DROP TABLE IF EXISTS public.user_profiles;

-- Make sure any triggers or functions related to user_profiles are also dropped
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    -- Find and drop any triggers that reference user_profiles
    FOR trigger_rec IN 
        SELECT tgname, relname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'user_profiles'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
                      trigger_rec.tgname, 'public', trigger_rec.relname);
    END LOOP;
END $$;

-- Ensure the profiles table exists and has correct structure
-- This is a redundant check since we already created it
SELECT EXISTS (
   SELECT FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename = 'profiles'
);
`;

// Your Supabase project details
// You'll need to fill these in before running the script
const SUPABASE_URL = 'https://wfulsrexakuiykbtjmid.supabase.co';
const SUPABASE_SERVICE_KEY = ''; // IMPORTANT: You need to fill in your service role key here

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: You need to add your Supabase service role key to this script.');
  console.error('Find it in your Supabase dashboard under Project Settings > API > service_role key');
  process.exit(1);
}

// Prepare the request data
const data = JSON.stringify({
  query: sqlContent
});

const options = {
  hostname: 'wfulsrexakuiykbtjmid.supabase.co',
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'return=representation'
  }
};

// Make the request
const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('SQL executed successfully!');
      try {
        const parsedResponse = JSON.parse(responseData);
        console.log('Response:', parsedResponse);
      } catch (e) {
        console.log('Raw response:', responseData);
      }
    } else {
      console.error(`Error (${res.statusCode}):`, responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();

console.log('Executing SQL command to drop user_profiles table...'); 