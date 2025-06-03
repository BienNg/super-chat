import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Link
} from 'lucide-react';
import LinkModal from './LinkModal';

const RichTextEditor = forwardRef(({ 
    value = '', 
    onChange, 
    placeholder = 'Type your message...', 
    onKeyDown,
    className = '',
    disabled = false,
    isDraftSaved = false
}, ref) => {
    const editorRef = useRef(null);
    const [selection, setSelection] = useState(null);
    const [activeFormats, setActiveFormats] = useState(new Set());
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkModalData, setLinkModalData] = useState({ text: '', url: '' });

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        focus: () => {
            if (editorRef.current) {
                editorRef.current.focus();
            }
        },
        clear: () => {
            if (editorRef.current) {
                // Mark as internal update to prevent triggering onChange
                isInternalUpdate.current = true;
                editorRef.current.innerHTML = '';
                // Don't call onChange here - let the parent handle state updates
            }
        },
        getContent: () => {
            return editorRef.current?.innerHTML || '';
        },
        insertText: (text) => {
            if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand('insertText', false, text);
                onChange?.(editorRef.current.innerHTML);
            }
        }
    }), [onChange]);

    // Initialize editor content (only on mount, not on every value change)
    useEffect(() => {
        if (editorRef.current && value && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, []); // Only run on mount

    // Separate effect for external value updates (like loading drafts or clearing)
    const isInternalUpdate = useRef(false);
    useEffect(() => {
        if (editorRef.current && !isInternalUpdate.current) {
            const currentContent = editorRef.current.innerHTML;
            const normalizedValue = value || '';
            const normalizedCurrent = currentContent || '';
            
            // Update if values are different (including empty string clearing)
            if (normalizedValue !== normalizedCurrent) {
                // Save cursor position
                const selection = window.getSelection();
                let cursorPosition = 0;
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    cursorPosition = range.startOffset;
                }
                
                editorRef.current.innerHTML = normalizedValue;
                
                // Restore cursor position (only if there's content)
                if (cursorPosition > 0 && normalizedValue && editorRef.current.firstChild) {
                    try {
                        const range = document.createRange();
                        const textNode = editorRef.current.firstChild;
                        const maxOffset = textNode.textContent?.length || 0;
                        range.setStart(textNode, Math.min(cursorPosition, maxOffset));
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    } catch (error) {
                        // Ignore cursor restoration errors
                        console.debug('Could not restore cursor position:', error);
                    }
                }
            }
        }
        isInternalUpdate.current = false;
    }, [value]);

    // Track selection and active formats
    const updateSelection = useCallback(() => {
        const sel = window.getSelection();
        if (sel.rangeCount > 0) {
            setSelection(sel.getRangeAt(0));
            
            // Check active formats
            const formats = new Set();
            if (document.queryCommandState('bold')) formats.add('bold');
            if (document.queryCommandState('italic')) formats.add('italic');
            if (document.queryCommandState('strikeThrough')) formats.add('strikethrough');
            
            // Better list detection
            const parentElement = sel.anchorNode?.parentElement;
            const listParent = parentElement?.closest('ul, ol');
            if (listParent) {
                if (listParent.tagName === 'UL') {
                    formats.add('unorderedList');
                } else if (listParent.tagName === 'OL') {
                    formats.add('orderedList');
                }
            }
            
            setActiveFormats(formats);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('selectionchange', updateSelection);
        return () => document.removeEventListener('selectionchange', updateSelection);
    }, [updateSelection]);

    const handleInput = (e) => {
        isInternalUpdate.current = true;
        const content = e.target.innerHTML;
        onChange?.(content);
        updateSelection();
    };

    const handleKeyDown = (e) => {
        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    execCommand('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    execCommand('italic');
                    break;
                case 'k':
                    e.preventDefault();
                    insertLink();
                    break;
                default:
                    break;
            }
        }
        
        // Handle Tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                execCommand('outdent');
            } else {
                execCommand('indent');
            }
        }
        
        // Handle Enter key in lists
        if (e.key === 'Enter') {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const parentElement = selection.anchorNode?.parentElement;
                const listItem = parentElement?.closest('li');
                
                if (listItem) {
                    if (e.shiftKey) {
                        // Shift+Enter: Create a new list item
                        e.preventDefault();
                        
                        // Get the list parent to determine list type
                        const listParent = listItem.closest('ul, ol');
                        if (listParent) {
                            // Create a new list item element
                            const newListItem = document.createElement('li');
                            newListItem.innerHTML = '<br>'; // Add a line break for cursor positioning
                            
                            // Insert the new list item after the current one
                            listItem.parentNode.insertBefore(newListItem, listItem.nextSibling);
                            
                            // Move cursor to the new list item
                            const range = document.createRange();
                            const newSelection = window.getSelection();
                            range.setStart(newListItem, 0);
                            range.collapse(true);
                            newSelection.removeAllRanges();
                            newSelection.addRange(range);
                            
                            // Trigger onChange
                            setTimeout(() => {
                                if (editorRef.current) {
                                    onChange?.(editorRef.current.innerHTML);
                                }
                            }, 0);
                        }
                    } else {
                        // Regular Enter: Check if the current list item is empty to exit list
                        const listItemText = listItem.textContent?.trim();
                        if (!listItemText) {
                            // Exit the list if the current item is empty
                            e.preventDefault();
                            const listParent = listItem.closest('ul, ol');
                            if (listParent) {
                                if (listParent.tagName === 'UL') {
                                    execCommand('insertUnorderedList');
                                } else {
                                    execCommand('insertOrderedList');
                                }
                            }
                            return;
                        }
                        // If list item has content, let the default behavior handle it (which should create a new list item)
                    }
                }
            }
        }
        
        onKeyDown?.(e);
    };

    const execCommand = (command, value = null) => {
        if (disabled) return;
        
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        updateSelection();
        
        // Trigger onChange after command execution
        setTimeout(() => {
            if (editorRef.current) {
                onChange?.(editorRef.current.innerHTML);
            }
        }, 0);
    };

    const insertLink = () => {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        
        // Store the current selection for later use
        setSelection(selection.rangeCount > 0 ? selection.getRangeAt(0) : null);
        
        // Set initial data for the modal
        setLinkModalData({
            text: selectedText || '',
            url: ''
        });
        
        setShowLinkModal(true);
    };

    const handleLinkSave = (text, url) => {
        // Ensure URL has protocol
        const finalUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
        
        // Focus the editor
        editorRef.current?.focus();
        
        if (selection) {
            // Restore the selection
            const newSelection = window.getSelection();
            newSelection.removeAllRanges();
            newSelection.addRange(selection);
            
            // If there was selected text, replace it with the link
            if (selection.toString()) {
                const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                execCommand('insertHTML', linkHtml);
            } else {
                // Insert new link at cursor position
                const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                execCommand('insertHTML', linkHtml);
            }
        } else {
            // No stored selection, just insert at current position
            const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            execCommand('insertHTML', linkHtml);
        }
        
        // Reset the stored selection
        setSelection(null);
    };

    const toggleList = (listType) => {
        if (disabled) return;
        
        editorRef.current?.focus();
        
        // Get current selection
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const parentElement = selection.anchorNode?.parentElement;
        const listParent = parentElement?.closest('ul, ol');
        
        if (listParent) {
            // We're in a list, toggle it off
            document.execCommand(listType, false, null);
        } else {
            // We're not in a list, create one
            document.execCommand(listType, false, null);
        }
        
        updateSelection();
        
        // Trigger onChange after command execution
        setTimeout(() => {
            if (editorRef.current) {
                onChange?.(editorRef.current.innerHTML);
            }
        }, 0);
    };

    const basicFormatButtons = [
        { command: 'bold', icon: Bold, title: 'Bold (Ctrl+B)', active: 'bold' },
        { command: 'italic', icon: Italic, title: 'Italic (Ctrl+I)', active: 'italic' },
        { command: 'strikeThrough', icon: Strikethrough, title: 'Strikethrough', active: 'strikethrough' },
        { type: 'separator' },
        { command: 'insertUnorderedList', icon: List, title: 'Bullet List', active: 'unorderedList', handler: () => toggleList('insertUnorderedList') },
        { command: 'insertOrderedList', icon: ListOrdered, title: 'Numbered List', active: 'orderedList', handler: () => toggleList('insertOrderedList') },
        { type: 'separator' },
        { command: 'createLink', icon: Link, title: 'Insert Link (Ctrl+K)', handler: insertLink },
    ];

    const renderToolbarButtons = (buttons) => {
        return buttons.map((button, index) => {
            if (button.type === 'separator') {
                return <div key={index} className="w-px h-6 bg-gray-300 mx-1" />;
            }

            const Icon = button.icon;
            const isActive = button.active && activeFormats.has(button.active);

            return (
                <button
                    key={index}
                    type="button"
                    disabled={disabled}
                    className={`p-1.5 rounded-md transition-colors ${
                        isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={button.title}
                    onClick={() => {
                        if (button.handler) {
                            button.handler();
                        } else {
                            execCommand(button.command, button.value);
                        }
                    }}
                >
                    <Icon className="h-4 w-4" />
                </button>
            );
        });
    };

    return (
        <div className={`rich-text-editor ${className}`}>
            {/* Toolbar */}
            <div className="border-b border-gray-200">
                {/* Basic Toolbar */}
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-1">
                        {renderToolbarButtons(basicFormatButtons)}
                    </div>
                    
                    {/* Draft indicator */}
                    <div>
                        {isDraftSaved && (
                            <div className="flex items-center text-xs text-gray-500">
                                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                                Draft saved
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable={!disabled}
                className={`min-h-[100px] max-h-[300px] p-3 focus:outline-none overflow-y-auto text-left ${
                    disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
                style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: '1.5',
                    textAlign: 'left'
                }}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                data-placeholder={placeholder}
                suppressContentEditableWarning={true}
            />

            {/* Link Modal */}
            <LinkModal
                isOpen={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                onSave={handleLinkSave}
                initialText={linkModalData.text}
                initialUrl={linkModalData.url}
            />

            <style jsx>{`
                .rich-text-editor [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9CA3AF;
                    pointer-events: none;
                }
                
                .rich-text-editor blockquote {
                    border-left: 4px solid #E5E7EB;
                    padding-left: 16px;
                    margin: 8px 0;
                    color: #6B7280;
                    font-style: italic;
                }
                
                .rich-text-editor ul, .rich-text-editor ol {
                    margin: 8px 0;
                    padding-left: 24px;
                    list-style-position: outside;
                }
                
                .rich-text-editor ul {
                    list-style-type: disc;
                }
                
                .rich-text-editor ol {
                    list-style-type: decimal;
                }
                
                .rich-text-editor li {
                    margin: 4px 0;
                    display: list-item;
                }
                
                .rich-text-editor a {
                    color: #6366F1;
                    text-decoration: underline;
                }
                
                .rich-text-editor strong {
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
});

export default RichTextEditor; 