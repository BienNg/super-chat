# Student Management System - Database Setup Guide

## Overview

This student management system is now fully integrated with Firebase Firestore for persistent data storage. All student data and select field options are stored in the database and updated in real-time.

## 🚀 Quick Start

### 1. Initialize the Database

When you first run the application:

1. Navigate to the CRM interface
2. Click the **"DB Admin"** button in the top-right corner
3. Click **"Initialize Database"** to set up default data

This will create:
- **Funnel Steps**: Lead, Contacted, Interested, Paid, Enrolled
- **Course Interests**: A1.1-C1.1 levels (Online/Offline)
- **Platforms**: Facebook, Instagram, WhatsApp, Zalo, Website, Referral, LinkedIn, TikTok
- **Countries**: Vietnam, Germany, US, Canada, Australia, UK, France, Japan, etc.
- **Cities**: Major cities from supported countries
- **Sample Students**: 5 example student profiles

### 2. Start Using the System

After initialization, you can:
- View and search students
- Add new students with the modal form
- Filter students by funnel step, course interest, platform, and location
- Add new options dynamically through the select fields

## 📊 Database Structure

### Collections

The system uses the following Firestore collections:

```
/students
  - studentId: string
  - name: string
  - email: string (optional)
  - phone: string (optional)
  - location: string (required)
  - city: string (optional)
  - funnelStep: string (required)
  - interest: string (comma-separated values)
  - platform: string (comma-separated values)
  - courses: array (for future integration)
  - notes: string (optional)
  - avatar: string (initials)
  - avatarColor: string (hex color)
  - createdAt: timestamp
  - updatedAt: timestamp

/funnelSteps
  - value: string

/courseInterests
  - value: string

/platforms
  - value: string

/countries
  - value: string

/cities
  - value: string
```

## 🔧 Features

### Dynamic Select Fields

All select fields support:
- **Search functionality**: Type to filter options
- **Add new options**: Type a new value and click "Add [value]" to create it
- **Real-time updates**: New options appear immediately in all forms
- **Duplicate prevention**: System prevents adding duplicate options

### Multi-Select Fields

Course Interest and Platform fields support:
- **Multiple selections**: Choose multiple options
- **Tag display**: Selected items shown as removable tags
- **Search and add**: Search existing options or add new ones
- **Keyboard navigation**: Use Enter, Backspace, and Escape keys

### Student Management

- **Add students**: Comprehensive form with validation
- **Search students**: Search by name, email, or student ID
- **Filter students**: Multiple filter options
- **Real-time updates**: Changes appear immediately
- **Error handling**: Proper error messages and loading states

## 🛠️ Technical Implementation

### Hooks Used

- `useStudents()`: Manages student CRUD operations
- `useFunnelSteps()`: Manages funnel step options
- `useCourseInterests()`: Manages course interest options
- `usePlatforms()`: Manages platform options
- `useCountries()`: Manages country options
- `useCities()`: Manages city options

### Key Components

- `StudentsInterface`: Main table view with search and filters
- `AddStudentModal`: Form for adding new students
- `CustomSelect`: Single-select dropdown with add new capability
- `MultiSelect`: Multi-select with tags and search
- `DatabaseInitializer`: Admin tool for database setup

## 🔒 Security

The system uses Firebase security rules. Make sure your Firestore rules allow:
- Read/write access to authenticated users
- Proper validation of required fields
- Prevention of unauthorized access

Example Firestore rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write student data
    match /students/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Allow authenticated users to read/write option collections
    match /{collection}/{document} {
      allow read, write: if request.auth != null 
        && collection in ['funnelSteps', 'courseInterests', 'platforms', 'countries', 'cities'];
    }
  }
}
```

## 🚨 Important Notes

1. **First Time Setup**: Always run "Initialize Database" on first use
2. **Data Backup**: The "Reset Database" function will delete ALL data
3. **Real-time Updates**: Changes are immediately reflected across all users
4. **Validation**: Email format and required fields are validated
5. **Duplicate Prevention**: System prevents duplicate emails and option values

## 🔄 Data Migration

If you need to migrate existing data:

1. Export your current data
2. Use the `resetDatabase()` function to clear everything
3. Modify the `sampleStudents` array in `initializeDatabase.js`
4. Run the initialization again

## 📱 Usage Tips

- Use the search bar to quickly find students
- Combine multiple filters for precise results
- Add new options directly from the forms - no need to pre-configure everything
- Use the multi-select fields to tag students with multiple interests/platforms
- Check the console for detailed operation logs

## 🐛 Troubleshooting

### Common Issues

1. **"Permission denied" errors**: Check Firebase authentication and security rules
2. **Options not loading**: Ensure collections are properly initialized
3. **Slow performance**: Check network connection and Firebase quotas
4. **Duplicate entries**: System should prevent these, but check for case sensitivity

### Debug Mode

Check the browser console for detailed logs of all database operations.

---

The system is now fully functional with persistent storage, real-time updates, and dynamic option management! 