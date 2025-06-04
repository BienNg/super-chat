# Supabase Database Setup Instructions

## Option 1: Running SQL Directly (Recommended)

The easiest way to set up your database is to run the SQL script directly in the Supabase dashboard:

1. Log in to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (with ID `wfulsrexakuiykbtjmid`)
3. Navigate to the "SQL Editor" section in the left sidebar
4. Create a new query
5. Copy and paste the SQL script from the README.md file
6. Click the "Run" button

## Option 2: Using the Node.js Script

If you prefer to run the script programmatically:

1. Open the `run-sql.js` file in this project
2. Get your Supabase service role key:
   - Go to your Supabase dashboard
   - Navigate to Project Settings > API
   - Copy the `service_role` key (NOT the anon key)
3. Paste the service role key into the `SUPABASE_SERVICE_KEY` variable in the script
4. Run the script with Node.js:
   ```
   node run-sql.js
   ```

## What This Setup Does

The SQL script will:
1. Create the `profiles` table if it doesn't exist
2. Set up Row Level Security policies
3. Create appropriate indexes
4. Set up a trigger to automatically create profiles for new users
5. Remove the redundant `user_profiles` table

After running this setup, restart your application and everything should work properly.

## Troubleshooting

If you encounter any errors:
1. Make sure the `profiles` table exists
2. Check that the RLS policies are correctly set up
3. Verify that the trigger for new user creation exists
4. Ensure the `user_profiles` table has been dropped

You can view your database tables in the Supabase dashboard under the "Table Editor" section. 