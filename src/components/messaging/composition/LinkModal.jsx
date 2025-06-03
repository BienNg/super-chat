import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const LinkModal = ({ isOpen, onClose, onSave, initialText = '', initialUrl = '' }) => {
    const [text, setText] = useState(initialText);
    const [url, setUrl] = useState(initialUrl);
    const textInputRef = useRef(null);
    const urlInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setText(initialText);
            setUrl(initialUrl);
            // Focus the appropriate input field
            setTimeout(() => {
                if (initialText && !initialUrl) {
                    urlInputRef.current?.focus();
                } else {
                    textInputRef.current?.focus();
                }
            }, 100);
        }
    }, [isOpen, initialText, initialUrl]);

    const handleSave = () => {
        if (text.trim() && url.trim()) {
            onSave(text.trim(), url.trim());
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Add link</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Text Field */}
                    <div>
                        <label htmlFor="link-text" className="block text-sm font-medium text-gray-700 mb-1">
                            Text
                        </label>
                        <input
                            ref={textInputRef}
                            id="link-text"
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter link text"
                        />
                    </div>

                    {/* URL Field */}
                    <div>
                        <label htmlFor="link-url" className="block text-sm font-medium text-gray-700 mb-1">
                            Link
                        </label>
                        <input
                            ref={urlInputRef}
                            id="link-url"
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="https://example.com"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!text.trim() || !url.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LinkModal; 