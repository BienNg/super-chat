# URL Routing Guide

This document explains the URL routing structure implemented for the Chatter application, supporting tabs, message threads, and task details while maintaining the navigation structure.

## URL Structure

### Base Routes

- `/login` - Authentication page
- `/onboarding` - Role selection after first login
- `/channels` - Main application (redirects to first channel)

### Channel Routes

All channel-related routes follow this pattern:
```
/channels/{channelId}/{tab}/{content}
```

### Tab Routes

#### Messages Tab
- `/channels/{channelId}/messages` - Messages tab (default)
- `/channels/{channelId}/messages/thread/{messageId}` - Message thread view

#### Tasks Tab
- `/channels/{channelId}/tasks` - Tasks list view
- `/channels/{channelId}/tasks/{taskId}` - Specific task details

#### Classes Tab
- `/channels/{channelId}/classes` - Classes tab (redirects to courses)
- `/channels/{channelId}/classes/courses` - Classes courses overview
- `/channels/{channelId}/classes/info` - Classes info sub-tab

#### Wiki Tab
- `/channels/{channelId}/wiki` - Wiki main page
- `/channels/{channelId}/wiki/{pageId}` - Specific wiki page

## Navigation Behavior

### Persistent Elements
The following elements remain visible and functional across all routes:
- Left navigation bar (main app sections)
- Channel sidebar (channel list and direct messages)
- Channel header (channel name and member count)
- Tab navigation (Messages, Classes, Tasks, Wiki)

### URL Changes
Only the main content area changes based on the URL. The navigation structure is preserved.

### Default Redirects
- `/` → `/channels`
- `/channels` → `/channels/{firstChannelId}/messages`
- `/channels/{channelId}` → `/channels/{channelId}/messages`
- `/channels/{channelId}/classes` → `/channels/{channelId}/classes/courses`

## Implementation Details

### Route Parsing
The `useRouteInfo` hook extracts route information:
```javascript
const { currentTab, contentType, contentId, subTab, channelId } = useRouteInfo();
```

### Navigation Functions
- `handleTabSelect(tab)` - Navigate between tabs
- `handleOpenThread(messageId)` - Open message thread
- `handleOpenTask(taskId)` - Open task details
- `handleChannelSelect(channelId)` - Switch channels

### State Management
- URL state is the single source of truth for current tab and content
- Component state is synchronized with URL parameters
- Browser back/forward buttons work correctly

## Examples

### Typical User Flow
1. User logs in → `/login`
2. Completes onboarding → `/onboarding`
3. Lands on first channel → `/channels/general/messages`
4. Clicks Tasks tab → `/channels/general/tasks`
5. Selects a task → `/channels/general/tasks/task123`
6. Switches to Classes → `/channels/general/classes/courses`
7. Opens thread in Messages → `/channels/general/messages/thread/msg456`

### Deep Linking
Users can bookmark and share specific URLs:
- Share a task: `/channels/project-alpha/tasks/urgent-bug-fix`
- Share a thread: `/channels/general/messages/thread/announcement-123`
- Share a wiki page: `/channels/docs/wiki/getting-started`

## Browser Support

- Full support for browser back/forward navigation
- URL updates without page refresh
- Proper handling of browser refresh (maintains current state)
- Support for opening links in new tabs

## Error Handling

- Invalid channel IDs redirect to channel list
- Invalid task/message IDs show appropriate error states
- Malformed URLs redirect to default routes
- Missing permissions handled gracefully

## Future Enhancements

- Query parameters for search filters
- Hash fragments for scroll positions
- URL state for modal dialogs
- Breadcrumb navigation for complex nested routes 