# Class Management System

## Overview

A comprehensive class management system with premium UI design, featuring course creation, student enrollment, progress tracking, and real-time data management. Built with award-winning UX principles and enterprise-grade backend integration.

## Features

### 🎓 Course Management
- **Course Creation**: Full course setup with auto-generate functionality for end dates
- **Holiday Integration**: Automatic holiday detection and skipping for Vietnam and Germany
- **Schedule Management**: Flexible weekday selection and calendar integration
- **Teacher Assignment**: Multi-teacher support with dynamic management
- **Resource Linking**: Google Drive integration for course materials

### 👥 Student Management
- **Student Enrollment**: Streamlined student addition with comprehensive forms
- **Progress Tracking**: Visual progress bars and attendance monitoring
- **Payment Management**: Multi-currency support (VND, USD, EUR)
- **Status Management**: Active, pending, and inactive student states
- **Search & Filter**: Real-time student search and filtering capabilities

### 🎨 Premium UI/UX Design
- **Award-Winning Design**: Follows enterprise design system principles
- **Responsive Layout**: Optimized for all screen sizes
- **Interactive States**: Smooth animations and hover effects
- **Accessibility**: Full keyboard navigation and screen reader support
- **Color System**: Sophisticated color palette with semantic meaning

## Components

### ClassDetailsView
The main component displaying comprehensive class information and student management.

**Features:**
- Split-panel layout with course details and student list
- Real-time student data with mock fallback
- Interactive student cards with progress visualization
- Integrated modals for editing and adding students

**Props:**
```jsx
<ClassDetailsView 
  channelId="channel-id" 
  channelName="Channel Name" 
/>
```

### AddStudentToClassModal
Premium modal for adding new students to a class.

**Features:**
- Multi-step form with validation
- Auto-generated avatars and colors
- Currency selection and payment tracking
- Error handling and loading states

**Props:**
```jsx
<AddStudentToClassModal
  isOpen={boolean}
  onClose={() => void}
  onAddStudent={(studentData) => Promise}
  className="Class Name"
/>
```

### CreateCourseModal
Enhanced course creation modal with auto-generate functionality.

**Features:**
- Holiday-aware date calculation
- Multi-location support (Vietnam/Germany)
- Weekday selection with visual feedback
- Teacher and resource management

## Backend Integration

### useEnrollments Hook
Manages student enrollment and class-specific data using the modern enrollments system.

**Methods:**
- `enrollStudent(enrollmentData)` - Add new student enrollment
- `updateEnrollment(id, updates)` - Update enrollment information
- `removeEnrollment(id)` - Remove student enrollment
- `getEnrollmentStats()` - Get enrollment statistics and analytics
- `getClassEnrollments(classId)` - Get enrollments for a specific class
- `getCourseEnrollments(courseId)` - Get enrollments for a specific course
- `searchEnrollments(term, filters)` - Search and filter enrollments

**Data Structure:**
```javascript
{
  studentId: "student-id", // Reference to students collection
  courseId: "course-id", // Reference to courses collection
  classId: "class-id", // Reference to classes collection
  
  // Denormalized student data
  studentName: "Student Name",
  studentEmail: "student@example.com",
  
  // Denormalized course data
  courseName: "Advanced English",
  courseLevel: "B2",
  
  // Denormalized class data
  className: "English Class 2024",
  
  // Enrollment specific data
  status: "active", // active | completed | dropped | suspended
  progress: 85, // 0-100
  attendance: 92, // 0-100
  grade: "A", // Final grade
  
  // Payment information
  amount: 5900000,
  currency: "VND",
  paymentStatus: "paid", // pending | paid | partial | overdue
  paymentId: "payment-id", // Reference to payments collection
  
  // Dates
  enrollmentDate: Date,
  startDate: Date,
  endDate: Date,
  completionDate: Date,
  
  // Additional information
  notes: "Additional notes",
  avatar: "SN",
  avatarColor: "bg-blue-500"
}
```

### useClasses Hook
Manages course/class creation and management.

**Methods:**
- `createClass(classData, channelId)` - Create new class
- `updateClass(classId, updates)` - Update class information
- `getClassByChannelId(channelId)` - Get class by channel
- `archiveClass(channelId)` - Archive class

## Design System

### Color Palette
- **Primary**: Indigo (`#6366F1`) - Brand and interactive elements
- **Success**: Emerald (`#10B981`) - Positive states and progress
- **Warning**: Yellow (`#F59E0B`) - Attention and pending states
- **Error**: Red (`#EF4444`) - Error states and critical actions
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headers**: Inter font family, semibold weights
- **Body**: Regular and medium weights for readability
- **UI Elements**: Small sizes with appropriate contrast

### Spacing
- **Grid System**: 4px base unit for consistent spacing
- **Component Padding**: 16px standard, 24px for expanded areas
- **Section Spacing**: 24px between major sections

### Interactive States
- **Hover**: Subtle background changes and color shifts
- **Focus**: 2px indigo ring with proper offset
- **Active**: Darker color variants for pressed states
- **Loading**: Smooth spinner animations

## Usage Examples

### Basic Implementation
```jsx
import { ClassDetailsView } from '../classes';

function ClassTab({ channelId, channelName }) {
  return (
    <div className="h-full">
      <ClassDetailsView 
        channelId={channelId}
        channelName={channelName}
      />
    </div>
  );
}
```

### With Custom Student Management
```jsx
import { useEnrollments } from '../../../hooks/useEnrollments';
import { AddStudentToClassModal } from '../classes';

function CustomStudentManager({ classId }) {
  const { enrollStudent, getClassEnrollments } = useEnrollments();
  const [showModal, setShowModal] = useState(false);
  
  const classEnrollments = getClassEnrollments(classId);

  const handleAddStudent = async (studentData) => {
    await enrollStudent({
      ...studentData,
      classId: classId,
      status: 'active'
    });
    setShowModal(false);
  };

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Add Student
      </button>
      
      <AddStudentToClassModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddStudent={handleAddStudent}
        className="My Class"
      />
    </>
  );
}
```

## Data Flow

1. **Class Creation**: User creates class through CreateCourseModal
2. **Backend Storage**: Class data stored in Firestore `classes` collection
3. **Student Enrollment**: Students added through AddStudentToClassModal
4. **Student Storage**: Enrollment data stored in `enrollments` collection
5. **Real-time Updates**: UI updates automatically with new data
6. **Progress Tracking**: Student progress and attendance updated in real-time

## Performance Optimizations

- **Lazy Loading**: Components load only when needed
- **Memoization**: Expensive calculations cached with useMemo
- **Optimistic Updates**: UI updates immediately for better UX
- **Error Boundaries**: Graceful error handling and recovery
- **Loading States**: Smooth loading indicators throughout

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant color combinations
- **Focus Management**: Logical tab order and focus trapping
- **Reduced Motion**: Respects user motion preferences

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Responsive**: Optimized for tablets and mobile devices

## Future Enhancements

- **Bulk Operations**: Multi-select for batch student operations
- **Advanced Analytics**: Detailed progress and attendance reports
- **Export Functionality**: CSV/PDF export for student data
- **Integration APIs**: Third-party LMS integration capabilities
- **Notification System**: Email/SMS notifications for important events

## Contributing

When contributing to the class management system:

1. Follow the established design system
2. Maintain accessibility standards
3. Add proper TypeScript types
4. Include comprehensive tests
5. Update documentation for new features

## Support

For questions or issues with the class management system, please refer to the main project documentation or contact the development team. 