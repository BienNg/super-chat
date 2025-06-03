# Firebase to Supabase Migration Guide

This directory contains scripts and utilities to migrate data from Firebase to Supabase.

## Migration Steps

### 1. Set up Supabase

1. Create a new Supabase project at https://supabase.com
2. Keep note of your Supabase URL and anon key
3. Set up email and Google authentication in the Supabase dashboard

### 2. Create Supabase Tables

1. Run the SQL script in the Supabase SQL editor:
   ```
   cat supabase-crm-migration.sql | pbcopy
   ```
2. Paste the copied SQL into the Supabase SQL editor and run it

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Firebase Config
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
FIREBASE_APP_ID=your_firebase_app_id

# Supabase Config
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Install Dependencies

```bash
npm install @supabase/supabase-js dotenv firebase
```

### 5. Run the Migration Script

```bash
# Install dotenv CLI if not already installed
npm install -g dotenv-cli

# Run the migration script with dotenv
dotenv node migration/migrateFirebaseToSupabase.js
```

### 6. Verify Migration

1. Check the Supabase dashboard to ensure all data has been migrated correctly
2. Compare record counts between Firebase and Supabase
3. Test the application with the new Supabase backend

## Troubleshooting

If you encounter issues during migration:

1. Check the console output for error messages
2. Verify that your environment variables are correctly set
3. Ensure that your Supabase tables have the correct schema
4. Check for any unique constraints or validation rules that might be preventing data insertion

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Firebase to Supabase Migration Guide](https://supabase.com/docs/guides/migrations/firebase) 