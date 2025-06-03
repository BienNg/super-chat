# Channel-to-Class Linking Implementation

## Overview

This implementation provides automatic creation and management of class records when channels are set to type "class". It follows a one-to-one relationship model where each channel can have at most one linked class.

## Database Schema

### Classes Collection Structure

```javascript
// Collection: 'classes'
{
  id: "auto-generated-id",
  channelId: "channel-id", // One-to-one relationship
  className: "ENGLISH C1.1", // From form
  classType: "G", // From classTypes collection
  format: "Online", // Online or Offline
  googleDriveUrl: "https://drive.google.com/...", // Optional
  teachers: ["teacher1", "teacher2"], // Array of teacher names
  level: "C1.1", // From classLevels collection
  beginDate: "2024-01-15", // Optional
  endDate: "2024-06-15", // Optional
  days: ["Mon", "Wed", "Fri"], // Array of weekdays
  status: "active", // active, archived, completed
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: "user-id"
}
```

### Firestore Indexes

The following indexes are configured for efficient querying:

- `channelId` (for one-to-one lookup)
- `teachers` (array-contains for teacher queries)
- `classType` + `createdAt` (for filtering by type)
- `level` + `createdAt` (for filtering by level)
- `status` + `createdAt` (for active/archived filtering)
- `createdAt` (for sorting)

## Key Components

### 1. useClasses Hook (`src/hooks/useClasses.js`)

Provides CRUD operations for classes:

- `createClass(classData, channelId)` - Creates a new class linked to a channel
- `updateClass(classId, updates)` - Updates an existing class
- `archiveClass(channelId)` - Archives a class when channel type changes
- `getClassByChannelId(channelId)` - Retrieves class for a specific channel
- `queryClasses(filters)` - Query classes by teacher, level, type, status

### 2. useChannelClassSync Hook (`src/hooks/useChannelClassSync.js`)

Handles automatic synchronization between channel types and classes:

- `handleChannelTypeChange(channelId, newType, oldType, channelName)` - Manages class creation/archiving
- `ensureClassExists(channelId, channelType, channelName)` - Ensures existing class channels have classes

### 3. ClassView Component (`src/components/messaging/classes/ClassView.jsx`)

Displays class information and provides editing capabilities:

- Shows class details in a structured layout
- Handles empty states for channels without classes
- Integrates with CreateClassModal for editing

### 4. CreateClassModal Component (`src/components/messaging/classes/CreateClassModal.jsx`)

Modal for creating and editing classes:

- Supports both create and edit modes
- Integrates with existing class management collections (levels, types, teachers)
- Validates one-to-one channel relationship

## Automatic Behavior

### Channel Type Changes

When a channel type is changed:

1. **TO 'class'**: Automatically creates a class record with default values
2. **FROM 'class'**: Archives the existing class (sets status to 'archived')

### Integration Points

The sync functionality is integrated into:

- `ChannelAboutModal` - When users change channel type
- Future: Channel creation process
- Future: Bulk channel operations

## Usage Examples

### Creating a Class Programmatically

```javascript
const { createClass } = useClasses();

const classData = {
  className: 'ENGLISH C1.1',
  type: 'G',
  format: 'Online',
  teachers: ['John Smith'],
  level: 'C1.1',
  beginDate: '2024-01-15',
  endDate: '2024-06-15',
  days: ['Mon', 'Wed', 'Fri'],
  sheetUrl: 'https://docs.google.com/spreadsheets/...'
};

const newClass = await createClass(classData, channelId);
```

### Querying Classes

```javascript
const { queryClasses } = useClasses();

// Get all classes by a specific teacher
const teacherClasses = await queryClasses({ teacher: 'John Smith' });

// Get all active C1.1 level classes
const levelClasses = await queryClasses({ 
  level: 'C1.1', 
  status: 'active' 
});
```

### Handling Channel Type Changes

```javascript
const { handleChannelTypeChange } = useChannelClassSync();

// This is automatically called when channel type changes
await handleChannelTypeChange(
  channelId, 
  'class',      // new type
  'general',    // old type
  'english-c1'  // channel name
);
```

## Performance Considerations

### Efficient Querying

- Uses Firestore indexes for all query patterns
- Limits results where appropriate
- Caches class data at component level

### Scalability

- Designed to handle hundreds of classes efficiently
- Uses compound indexes for complex queries
- Implements proper pagination patterns (ready for future expansion)

## Future Enhancements

### Planned Features

1. **Student Enrollment**: Link students to classes (separate from channel members)
2. **Class Schedules**: Calendar integration and session management
3. **Google Sheets Sync**: Automatic synchronization with external spreadsheets
4. **Notifications**: Class creation/update notifications
5. **Bulk Operations**: Manage multiple classes simultaneously
6. **Reporting**: Class analytics and dashboards

### Integration Points

- **Calendar Systems**: For scheduling and reminders
- **Student Management**: For enrollment and progress tracking
- **External APIs**: For Google Sheets and other integrations
- **Notification System**: For class-related alerts

## Security

### Firestore Rules

```javascript
// Classes collection - for channel-linked classes
match /classes/{classId} {
  allow read, write: if request.auth != null;
}
```

Current implementation allows all authenticated users to read/write classes. Future versions should implement role-based access control.

## Error Handling

### Common Scenarios

1. **Duplicate Classes**: Prevents creating multiple classes for the same channel
2. **Missing Channel**: Validates channel existence before class creation
3. **Invalid Data**: Form validation and server-side checks
4. **Network Errors**: Graceful error handling with user feedback

### Validation Rules

- Channel ID is required for all class operations
- One-to-one relationship is enforced at database level
- Class names are automatically formatted (uppercase)
- Date validation ensures end date is after begin date

## Testing

### Key Test Cases

1. Channel type change from non-class to class
2. Channel type change from class to non-class
3. Class creation with valid data
4. Class update operations
5. Duplicate class prevention
6. Error handling scenarios

### Manual Testing

1. Create a channel and set type to "class"
2. Verify class is automatically created
3. Edit class information through the UI
4. Change channel type away from "class"
5. Verify class is archived
6. Test query functionality with filters 