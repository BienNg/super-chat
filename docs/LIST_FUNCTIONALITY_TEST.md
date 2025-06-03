# List Functionality Test Guide

## Testing Bullet Lists and Numbered Lists

This guide helps you test the list functionality in the Chatter rich text editor.

### How to Test

1. **Open the Chatter app** and navigate to any channel
2. **Click in the message composition area** at the bottom
3. **Test Bullet Lists:**
   - Click the bullet list button (•) in the toolbar
   - Type "First item" and press Enter
   - Type "Second item" and press Enter
   - Type "Third item" and press Enter twice to exit the list
   - Send the message

4. **Test Numbered Lists:**
   - Click the numbered list button (1.) in the toolbar
   - Type "Step 1" and press Enter
   - Type "Step 2" and press Enter
   - Type "Step 3" and press Enter twice to exit the list
   - Send the message

### Expected Behavior

#### In the Editor:
- Lists should display with proper bullets/numbers
- Pressing Enter should create new list items
- Pressing Enter twice on an empty item should exit the list
- List buttons should highlight when cursor is in a list

#### In Sent Messages:
- Bullet lists should show with disc bullets (•)
- Numbered lists should show with decimal numbers (1. 2. 3.)
- Proper indentation and spacing should be maintained
- Lists should be visually distinct from regular text

### Troubleshooting

If lists aren't working:

1. **Check the browser console** for any JavaScript errors
2. **Verify the toolbar buttons** are clickable and not disabled
3. **Test keyboard shortcuts** - lists should work with Tab/Shift+Tab for indentation
4. **Check message display** - sent messages should preserve list formatting

### Technical Details

- **HTML Structure**: Lists create `<ul>` and `<ol>` elements with `<li>` children
- **CSS Classes**: Message content uses `.message-content` class for styling
- **Sanitization**: DOMPurify allows `ul`, `ol`, and `li` tags in messages
- **Active States**: List buttons highlight when cursor is inside a list

### Known Issues

- Some browsers may handle list creation differently
- Copy/paste from external sources may not preserve list formatting
- Very long lists may affect performance in large messages

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+ 