# ActionsDropdown Component Usage Guide

The `ActionsDropdown` is a reusable component that provides a standardized dropdown menu for action buttons in lists and tables.

## Basic Usage

```jsx
import { ActionsDropdown } from '../shared';
import { Eye, Edit, Trash2, MessageSquare } from 'lucide-react';

// In your component
<ActionsDropdown
  itemId={item.id}
  item={item}
  actions={[
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      onClick: (item) => handleView(item)
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Edit,
      onClick: (item) => handleEdit(item)
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: (item) => handleDelete(item),
      isDanger: true,
      separator: true
    }
  ]}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `itemId` | string | - | Unique identifier for the item |
| `item` | object | - | The data item passed to action handlers |
| `actions` | array | [] | Array of action configuration objects |
| `disabled` | boolean | false | Whether the dropdown trigger is disabled |
| `className` | string | '' | Additional CSS classes |
| `dropdownWidth` | number | 12 | Width in rem units |
| `showSeparators` | boolean | true | Whether to show separators |

## Action Object Structure

```jsx
{
  key: 'unique-key',        // Required: Unique identifier
  label: 'Action Label',    // Required: Display text
  icon: IconComponent,      // Optional: Lucide React icon
  onClick: (item, e) => {}, // Required: Click handler
  disabled: false,          // Optional: Disable this action
  loading: false,           // Optional: Show loading state
  loadingLabel: 'Loading...', // Optional: Loading text
  isDanger: false,          // Optional: Style as danger action
  separator: false,         // Optional: Add separator before this action
  className: '',            // Optional: Additional CSS classes
  title: ''                 // Optional: Tooltip text
}
```

## Examples

### Students List Actions

```jsx
<ActionsDropdown
  itemId={student.id}
  item={student}
  actions={[
    {
      key: 'view',
      label: 'View Profile',
      icon: Eye,
      onClick: (student) => navigate(`/students/${student.id}`)
    },
    {
      key: 'edit',
      label: 'Edit Student',
      icon: Edit,
      onClick: (student) => setEditingStudent(student)
    },
    {
      key: 'addPayment',
      label: 'Add Payment',
      icon: CreditCard,
      onClick: (student) => handleAddPayment(student)
    },
    {
      key: 'sendMessage',
      label: 'Send Message',
      icon: MessageSquare,
      onClick: (student) => handleSendMessage(student),
      separator: true
    },
    {
      key: 'delete',
      label: 'Delete Student',
      icon: Trash2,
      onClick: (student) => handleDeleteStudent(student),
      isDanger: true,
      separator: true
    }
  ]}
/>
```

### Courses List Actions

```jsx
<ActionsDropdown
  itemId={course.id}
  item={course}
  actions={[
    {
      key: 'view',
      label: 'View Course',
      icon: Eye,
      onClick: (course) => handleViewCourse(course)
    },
    {
      key: 'edit',
      label: 'Edit Course',
      icon: Edit,
      onClick: (course) => handleEditCourse(course)
    },
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      onClick: (course) => handleDuplicateCourse(course)
    },
    {
      key: 'archive',
      label: course.archived ? 'Unarchive' : 'Archive',
      icon: Archive,
      onClick: (course) => handleToggleArchive(course),
      separator: true
    }
  ]}
/>
```

### With Loading States

```jsx
<ActionsDropdown
  itemId={item.id}
  item={item}
  disabled={processingId === item.id}
  actions={[
    {
      key: 'process',
      label: 'Process Item',
      icon: Play,
      onClick: (item) => handleProcess(item),
      loading: processingId === item.id,
      loadingLabel: 'Processing...',
      disabled: processingId === item.id
    },
    {
      key: 'cancel',
      label: 'Cancel',
      icon: X,
      onClick: (item) => handleCancel(item),
      disabled: processingId !== item.id
    }
  ]}
/>
```

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

- Normal actions: Gray text with gray hover background
- Danger actions: Red text with red hover background  
- Disabled actions: Gray text, no hover effects
- Loading states: Spinner icon with loading text

## Accessibility

- Keyboard navigation support
- Focus management
- ARIA attributes
- Screen reader friendly
- Proper color contrast for all states

## Notes

- The component automatically handles positioning (top/bottom) based on viewport space
- Click events are properly stopped from propagating to parent elements
- The dropdown closes automatically when clicking outside
- All actions receive the `item` object and event as parameters 