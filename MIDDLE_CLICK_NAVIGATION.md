# Middle-Click Navigation Feature

## Overview

The Chatter application now supports middle-click (mouse wheel click) and Ctrl+click functionality to open navigation items in new browser tabs. This feature enhances user productivity by allowing users to quickly open multiple channels, tabs, or content in separate browser tabs.

## Supported Navigation Elements

### 1. Main Sidebar Navigation
- **Messaging** - Opens messaging section in new tab
- **CRM** - Opens CRM section in new tab  
- **Bookkeeping** - Opens bookkeeping section in new tab

### 2. Channel Navigation
- **Channel List** - Middle-click any channel to open it in a new tab
- Preserves the last active tab for each channel

### 3. Tab Navigation
- **Messages Tab** - Opens messages tab in new tab
- **Tasks Tab** - Opens tasks tab in new tab
- **Classes Tab** - Opens classes tab in new tab
- **Wiki Tab** - Opens wiki tab in new tab
- **Import Tab** - Opens import tab in new tab

### 4. Sub-Tab Navigation (Classes)
- **Courses Sub-tab** - Opens courses view in new tab
- **Info Sub-tab** - Opens info view in new tab

### 5. Channel Toolbar Actions
- **Jump to Message** - Opens message in new tab (from pinned messages)
- **Open Thread** - Opens thread in new tab (from pinned messages)

## How to Use

### Middle-Click (Mouse Wheel Click)
1. Position your cursor over any supported navigation element
2. Click the middle mouse button (mouse wheel)
3. The URL will open in a new browser tab

### Ctrl+Click (Alternative Method)
1. Hold down the Ctrl key (Cmd key on Mac)
2. Left-click on any supported navigation element
3. The URL will open in a new browser tab

## Technical Implementation

### Core Utilities
- **`src/utils/navigation.js`** - Contains utility functions for middle-click handling
- **`generateChannelUrl()`** - Generates proper URLs for channels and tabs
- **`generateSectionUrl()`** - Generates URLs for main app sections
- **`getMiddleClickHandlers()`** - Returns event handlers for middle-click functionality

### Event Handling
- Detects middle-click (button 1) and Ctrl+click events
- Uses `window.open(url, '_blank')` to open URLs in new tabs
- Prevents default behavior and stops event propagation for middle-clicks
- Maintains normal left-click behavior for regular navigation

### URL Generation
- Generates proper URLs that match the application's routing structure
- Supports complex URLs with channel IDs, tab names, and sub-tabs
- Preserves user state and navigation history

## Browser Compatibility

- **Middle-Click**: Supported in all modern browsers
- **Ctrl+Click**: Universal support across all browsers and operating systems
- **Cmd+Click**: Supported on macOS (automatically handled by the implementation)

## Benefits

1. **Improved Productivity** - Users can quickly open multiple channels or tabs
2. **Better Workflow** - Compare content across different channels simultaneously
3. **Enhanced User Experience** - Familiar browser navigation patterns
4. **Preserved Context** - Original tab remains unchanged when opening new tabs

## Examples

### Opening Multiple Channels
1. Middle-click on "General" channel → Opens in new tab
2. Middle-click on "Project Alpha" channel → Opens in new tab
3. Compare conversations across both channels

### Opening Different Tabs
1. In a channel, middle-click "Tasks" tab → Opens tasks in new tab
2. Middle-click "Classes" tab → Opens classes in new tab
3. Work on tasks while viewing class information

### Quick Message Access
1. Expand pinned messages in channel toolbar
2. Middle-click "Jump to message" → Opens message in new tab
3. Continue working in original tab while viewing the message

## Future Enhancements

- Add middle-click support for message links and mentions
- Implement middle-click for task navigation
- Add support for opening specific wiki pages in new tabs
- Consider adding right-click context menu with "Open in new tab" option 