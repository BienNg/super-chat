# CRM Migration from Firebase to Supabase

This document outlines the changes made to migrate the CRM functionality from Firebase to Supabase.

## Completed Changes

### Data Storage and Retrieval

1. **Hooks Updated**:
   - `useStudents.js`: Converted to use Supabase database for student management
   - `useCountries.js`: Converted to use Supabase for countries collection
   - `useCities.js`: Converted to use Supabase for cities collection
   - `usePlatforms.js`: Converted to use Supabase for platforms collection
   - `useCategories.js`: Converted to use Supabase for categories collection
   - `useEnrollments.js`: Converted to use Supabase for enrollment management

2. **UI Components Updated**:
   - Created `SupabaseCollectionSelector.jsx` as a replacement for `FirebaseCollectionSelector.jsx`
   - Created `SupabaseMultiSelectSelector.jsx` as a replacement for `FirebaseMultiSelectSelector.jsx`
   - Updated imports in `shared/index.js` to export both Firebase and Supabase selectors
   - Updated `StudentInfoTab.jsx` to use Supabase selectors
   - Updated `StudentsInterface.jsx` to use Supabase selectors
   - Updated `AddStudentModal.jsx` to handle Supabase field naming conventions

3. **Service Utilities**:
   - Created `supabase-services.js` with similar functionality to `firebase-services.js`
   - Provided `studentServices` and `collectionServices` for common operations

### Database Schema and Migration

1. **SQL Schema Created**:
   - Created SQL script `supabase-crm-migration.sql` to define all necessary tables
   - Set up proper relationships between tables
   - Added row-level security (RLS) policies for data access

2. **Migration Utility**:
   - Created `migrateFirebaseToSupabase.js` utility for data migration
   - Handled field name transformations (camelCase to snake_case)
   - Preserved IDs and relationships during migration

3. **Migration Documentation**:
   - Created step-by-step guide for running the migration
   - Provided troubleshooting tips

## Database Table Structure

1. **Reference Tables**:
   - `countries`: For storing country options
   - `cities`: For storing city options
   - `platforms`: For storing platform options
   - `categories`: For storing category options

2. **Main Tables**:
   - `students`: Core student information
   - `courses`: Course information
   - `classes`: Class information
   - `enrollments`: Student enrollment records
   - `payments`: Payment records

## Field Name Conventions

The migration involved changing field names from Firebase's camelCase to Supabase's snake_case:

| Firebase Field      | Supabase Field      |
|---------------------|---------------------|
| createdAt           | created_at          |
| updatedAt           | updated_at          |
| studentId           | student_id          |
| courseId            | course_id           |
| classId             | class_id            |
| studentName         | student_name        |
| studentEmail        | student_email       |
| avatarColor         | avatar_color        |
| dateOfBirth         | date_of_birth       |
| emergencyContact    | emergency_contact   |
| enrollmentDate      | enrollment_date     |

## Additional Considerations

1. **Authentication Context**:
   - The CRM components now use the `SupabaseAuthContext` for authentication

2. **Real-time Updates**:
   - Supabase's real-time capabilities will be utilized in a future update

3. **Storage**:
   - Any file storage related to CRM will be migrated to Supabase Storage in a separate task 