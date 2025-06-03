# Courses Implementation

## Overview

This implementation separates courses from classes, creating a one-to-many relationship where one class can have multiple courses. Courses are now stored in a dedicated `courses` collection in Firestore, linked to classes via `classId`.

## Database Schema

### Courses Collection Structure

```javascript
// Collection: 'courses'
{
  id: "auto-generated-id",
  classId: "class-id", // Links to the classes collection
  channelId: "channel-id", // Links to the channels collection
  courseName: "ENGLISH C1.1 - Online - Zoom", // Full course name
  courseType: "G", // From classTypes collection
  format: "Online", // Online or Offline
  formatOption: "Zoom", // Location/platform details
  googleDriveUrl: "https://drive.google.com/...", // Optional
  teachers: ["teacher1", "teacher2"], // Array of teacher names
  level: "C1.1", // From classLevels collection
  beginDate: "2024-01-15", // Optional
  endDate: "2024-06-15", // Optional
  days: ["Mon", "Wed", "Fri"], // Array of weekdays
  totalDays: "20", // Total number of days
  status: "active", // active, archived, completed
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: "user-id"
}
```

### Relationship Structure

```
Channel (1) -> Class (1) -> Courses (many)
```

- Each channel can have one class
- Each class can have multiple courses
- Each course belongs to exactly one class AND one channel
- The channelId provides direct linkage for efficient querying

## Key Components

### 1. useCourses Hook (`src/hooks/useCourses.js`)

Provides CRUD operations for courses:

- `createCourse(courseData, classId, channelId)` - Creates a new course linked to a class and channel
- `updateCourse(courseId, updates)` - Updates an existing course
- `deleteCourse(courseId)` - Deletes a course and automatically cleans up class fields if it's the last course
- `archiveCourse(courseId)` - Archives a course
- `getCoursesByClassId(classId)` - Retrieves courses for a specific class
- `getCoursesByChannelId(channelId)` - Retrieves courses for a specific channel
- `queryCourses(filters)` - Query courses by teacher, level, type, status, classId, or channelId

### 2. Updated useCourseForm Hook (`src/components/messaging/classes/hooks/useCourseForm.js`)

Modified to:
- Use `useCourses` instead of `useClasses`
- Get `classId` from the channel's linked class
- Store course data in the `courses` collection
- Handle the new course data structure

### 3. Updated ClassesTab Component (`src/components/messaging/content/ClassesTab.jsx`)

Enhanced to:
- Fetch and display courses from the `courses` collection
- Show course cards with detailed information
- Support editing and deleting courses
- Provide a modern UI for course management

## Migration from Classes to Courses

### What Changed

1. **Data Storage**: Course information is now stored in a separate `courses` collection instead of being mixed with class metadata in the `classes` collection.

2. **Data Structure**: 
   - `className` → `courseName`
   - `classType` → `courseType`
   - Added `classId` field to link courses to classes

3. **UI**: The "Courses" sub-tab now displays actual courses instead of class information.

### What Stayed the Same

1. **Modal Layout**: The create/edit course modal remains exactly the same - only the backend logic changed.
2. **Class Information**: The "Info" sub-tab still shows class details from the `classes` collection.
3. **Channel-Class Relationship**: Channels still have a one-to-one relationship with classes.

## Firestore Indexes

The following indexes are configured for efficient course querying:

- `classId` + `createdAt` (for fetching courses by class)
- `teachers` (array-contains for teacher queries)
- `level` + `createdAt` (for filtering by level)
- `courseType` + `createdAt` (for filtering by type)
- `status` + `createdAt` (for active/archived filtering)

## Security Rules

Courses collection allows authenticated users to read and write course data:

```javascript
match /courses/{courseId} {
  allow read, write: if request.auth != null;
}
```

## Usage

### Creating a Course

1. Navigate to a channel with type "class"
2. Go to the "Classes" tab → "Courses" sub-tab
3. Click "Create New Course"
4. Fill in the course details (same form as before)
5. Course is saved to the `courses` collection linked to the channel's class

### Viewing Courses

- The "Courses" sub-tab displays all courses for the current class
- Each course shows: name, format, schedule, level, type, teachers
- Courses can be edited or deleted using the action buttons

### Course Management

- **Edit**: Click the edit icon on any course card
- **Delete**: Click the delete icon (with confirmation)
- **Create**: Use the "Create New Course" button

## Benefits

1. **Scalability**: Classes can now have multiple courses without data duplication
2. **Organization**: Clear separation between class metadata and course details
3. **Flexibility**: Easier to manage and query courses independently
4. **Maintainability**: Cleaner data structure and better code organization
5. **Direct Channel Linking**: Courses are now directly linked to channels for efficient querying
6. **Automatic Cleanup**: Class fields are automatically cleaned when the last course is deleted

## Automatic Class Cleanup

When the last course of a class is deleted, the system automatically cleans up the class record by removing course-specific fields:

### Fields Removed on Last Course Deletion:
- `format` (Online/Offline)
- `formatOption` (Location/platform details)
- `classType` (Course type)
- `days` (Course schedule days)

### How It Works:
1. **Course Deletion**: When a course is deleted, the system checks how many active courses remain for that class
2. **Last Course Check**: If no active courses remain (excluding the one being deleted), cleanup is triggered
3. **Field Removal**: The specified fields are completely removed from the class document using `deleteField()`
4. **Logging**: The cleanup operation is logged for debugging and verification

### Example:
```javascript
// Before deleting the last course
Class Document: {
  id: "class-123",
  className: "ENGLISH ADVANCED",
  format: "Online",
  formatOption: "Zoom",
  classType: "G",
  days: ["Mon", "Wed", "Fri"],
  // ... other fields
}

// After deleting the last course
Class Document: {
  id: "class-123", 
  className: "ENGLISH ADVANCED",
  // format, formatOption, classType, days fields are completely removed
  // ... other fields remain
}
```

This ensures that class records remain clean and only contain relevant data when courses exist.

## Usage Examples

### Creating a Course with Channel and Class ID

```javascript
import { useCourses } from '../hooks/useCourses';

const { createCourse } = useCourses();

const handleCreateCourse = async () => {
  const courseData = {
    courseName: "ENGLISH C1.1 - Advanced Grammar",
    level: "C1.1",
    teachers: ["John Doe", "Jane Smith"],
    beginDate: "2024-01-15",
    endDate: "2024-06-15",
    days: ["Mon", "Wed", "Fri"],
    totalDays: "20",
    sheetUrl: "https://drive.google.com/..."
  };

  // Both classId and channelId are now stored in the database
  const newCourse = await createCourse(courseData, classId, channelId);
  console.log('Course created with IDs:', {
    courseId: newCourse.id,
    classId: newCourse.classId,
    channelId: newCourse.channelId
  });
};
```

### Querying Courses by Channel ID

```javascript
import { useCourses } from '../hooks/useCourses';

const { getCoursesByChannelId, queryCourses } = useCourses();

// Get all courses for a specific channel
const channelCourses = await getCoursesByChannelId("channel-123");

// Query courses with multiple filters including channelId
const filteredCourses = await queryCourses({
  channelId: "channel-123",
  level: "C1.1",
  status: "active"
});
``` 