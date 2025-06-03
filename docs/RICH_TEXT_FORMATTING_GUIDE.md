# Rich Text Formatting Guide

This document explains the comprehensive rich text formatting features implemented in the Chatter application's message composition system.

## Overview

The enhanced RichTextEditor provides a complete formatting toolbar with basic and advanced formatting options, keyboard shortcuts, and intelligent content handling.

## Formatting Features

### Basic Formatting Toolbar

The basic toolbar is always visible and includes essential formatting options:

#### Text Formatting
- **Bold** (`Ctrl+B` / `Cmd+B`) - Make text bold
- **Italic** (`Ctrl+I` / `Cmd+I`) - Make text italic  
- **Strikethrough** - Cross out text

#### Lists
- **Bullet List** - Create unordered lists with bullet points
- **Numbered List** - Create ordered lists with numbers

#### Links
- **Insert Link** (`Ctrl+K` / `Cmd+K`) - Add hyperlinks to text

### Advanced Formatting Toolbar

The advanced toolbar can be toggled and includes additional formatting options:

#### Extended Text Formatting
- **Underline** (`Ctrl+U` / `Cmd+U`) - Underline text
- **Quote** - Format text as blockquote
- **Inline Code** (`Ctrl+\`` / `Cmd+\``) - Format text as inline code

#### Indentation Controls
- **Increase Indent** (`Tab`) - Indent content to the right
- **Decrease Indent** (`Shift+Tab`) - Outdent content to the left

#### Text Alignment
- **Align Left** - Left-align text
- **Align Center** - Center-align text
- **Align Right** - Right-align text

#### Utility
- **Clear Formatting** - Remove all formatting from selected text

## Keyboard Shortcuts

### Text Formatting
- `Ctrl+B` / `Cmd+B` - Bold
- `Ctrl+I` / `Cmd+I` - Italic
- `Ctrl+U` / `Cmd+U` - Underline
- `Ctrl+K` / `Cmd+K` - Insert link
- `Ctrl+\`` / `Cmd+\`` - Inline code

### Indentation
- `Tab` - Increase indent
- `Shift+Tab` - Decrease indent

### Navigation
- Standard text editing shortcuts (copy, paste, select all, etc.)

## Toolbar Behavior

### Basic vs Advanced Mode
- **Basic Mode**: Shows essential formatting tools (Bold, Italic, Strikethrough, Lists, Links)
- **Advanced Mode**: Adds extended formatting options (Underline, Quote, Code, Indentation, Alignment, Clear Formatting)
- **Toggle Button**: Click the "Type" icon to show/hide advanced options

### Context-Aware Display
- **Main Messages**: Full toolbar with advanced options available
- **Comments/Replies**: Basic toolbar only for streamlined experience
- **Edit Mode**: Full toolbar for comprehensive editing

### Visual Feedback
- **Active States**: Buttons highlight when formatting is applied to selected text
- **Hover Effects**: Buttons show hover states for better UX
- **Tooltips**: All buttons include helpful tooltips with keyboard shortcuts

## Content Styling

### Formatted Content Appearance

#### Text Formatting
```css
Bold text: font-weight: 600
Italic text: font-style: italic
Underlined text: text-decoration: underline
Strikethrough text: text-decoration: line-through
```

#### Code Formatting
```css
Inline code: 
- Background: #F3F4F6
- Color: #EF4444
- Font: Monaco, Menlo, Ubuntu Mono (monospace)
- Padding: 2px 4px
- Border radius: 4px
```

#### Lists
```css
Bullet/Numbered lists:
- Margin: 8px 0
- Padding-left: 24px
- List items: 4px margin between items
```

#### Quotes
```css
Blockquotes:
- Border-left: 4px solid #E5E7EB
- Padding-left: 16px
- Color: #6B7280
- Font-style: italic
- Margin: 8px 0
```

#### Links
```css
Hyperlinks:
- Color: #6366F1 (indigo)
- Text-decoration: underline
- Target: _blank (opens in new tab)
- Rel: noopener noreferrer (security)
```

#### Indentation
```css
Indented content:
- Margin-left: 40px per level
```

#### Text Alignment
```css
Center: text-align: center
Right: text-align: right
Left: text-align: left (default)
```

## Implementation Details

### Component Architecture
- **RichTextEditor**: Main formatting component with toolbar
- **MessageComposition**: Integrates editor with message sending
- **Toolbar Rendering**: Dynamic button generation with state management

### State Management
- **Active Formats**: Tracks which formatting is applied to current selection
- **Selection Tracking**: Monitors cursor position and text selection
- **Content Updates**: Handles real-time content changes and formatting

### Browser Compatibility
- **Document.execCommand**: Uses standard browser formatting commands
- **Selection API**: Leverages browser selection for formatting operations
- **Fallback Handling**: Graceful degradation for unsupported features

## Usage Examples

### Basic Text Formatting
1. Select text you want to format
2. Click the appropriate formatting button (Bold, Italic, etc.)
3. The text will be formatted and the button will show as active

### Creating Lists
1. Click the Bullet List or Numbered List button (or place cursor where you want the list)
2. Type your first list item
3. Press Enter to create a new list item
4. Press Enter twice on an empty list item to exit the list
5. Use Tab/Shift+Tab to indent/outdent list items

### Adding Links
1. Select text to make into a link (optional)
2. Click the Link button or press `Ctrl+K`
3. Enter the URL in the prompt
4. If no text was selected, enter the link text as well

### Using Indentation
1. Place cursor in the line/paragraph to indent
2. Press Tab to increase indent or Shift+Tab to decrease
3. Or use the Indent/Outdent buttons in the advanced toolbar

### Keyboard Shortcuts
1. Use standard shortcuts like `Ctrl+B` for bold
2. Tab and Shift+Tab work for indentation
3. All shortcuts work with selected text

## Advanced Features

### Draft Saving Integration
- Formatting is preserved in draft saves
- Rich content restored when loading drafts
- Visual indicator shows when drafts are saved

### Emoji Integration
- Emojis can be inserted at cursor position
- Formatting preserved around emoji insertion
- Seamless integration with text formatting

### Mention Support
- @mentions work with formatted text
- Formatting preserved around mentions
- Autocomplete integration planned

### Content Validation
- HTML content sanitization
- Character count includes formatted content
- Proper handling of nested formatting

## Accessibility

### Keyboard Navigation
- All formatting accessible via keyboard shortcuts
- Tab navigation through toolbar buttons
- Screen reader compatible button labels

### Visual Indicators
- Clear active/inactive button states
- High contrast hover effects
- Tooltip descriptions for all functions

### Content Structure
- Semantic HTML output (strong, em, ul, ol, etc.)
- Proper heading hierarchy support
- Screen reader friendly formatted content

## Performance Considerations

### Efficient Updates
- Optimized re-rendering on format changes
- Debounced content updates
- Minimal DOM manipulation

### Memory Management
- Proper event listener cleanup
- Efficient selection tracking
- Optimized toolbar rendering

## Future Enhancements

### Planned Features
- **Tables**: Table creation and editing
- **Images**: Inline image insertion and formatting
- **Code Blocks**: Multi-line code formatting with syntax highlighting
- **Custom Styles**: User-defined formatting styles
- **Markdown Support**: Markdown syntax shortcuts

### Integration Improvements
- **Collaborative Editing**: Real-time collaborative formatting
- **Version History**: Track formatting changes over time
- **Export Options**: Export formatted content to various formats
- **Template System**: Pre-defined message templates with formatting

## Troubleshooting

### Common Issues
- **Formatting Not Applied**: Ensure text is selected before clicking format buttons
- **Keyboard Shortcuts Not Working**: Check for browser conflicts or focus issues
- **Content Not Saving**: Verify draft saving is enabled and working
- **Toolbar Not Visible**: Check if advanced toolbar is toggled on
- **Lists Not Working**: 
  - Ensure cursor is positioned in the editor before clicking list buttons
  - Try clicking the list button again to toggle the list on/off
  - Check that the message content has the `.message-content` CSS class applied
  - Verify that `ul`, `ol`, and `li` tags are allowed in DOMPurify sanitization

### Browser Compatibility
- **Modern Browsers**: Full feature support in Chrome, Firefox, Safari, Edge
- **Legacy Support**: Graceful degradation for older browsers
- **Mobile Devices**: Touch-friendly interface with full functionality 