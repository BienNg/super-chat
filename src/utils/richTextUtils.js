/**
 * Utility functions for rich text content handling
 */

// Safe HTML tags that are allowed in messages
export const ALLOWED_HTML_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'strike', 'del', 's',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a'
];

// Regex pattern to detect rich text formatting
const RICH_TEXT_PATTERN = new RegExp(
    `<(${ALLOWED_HTML_TAGS.join('|')})\\b[^>]*>`,
    'i'
);

/**
 * Checks if content contains rich text formatting
 * @param {string} content - The content to check
 * @returns {boolean} - True if content has rich formatting
 */
export const hasRichFormatting = (content) => {
    if (!content || typeof content !== 'string') {
        return false;
    }
    
    return RICH_TEXT_PATTERN.test(content);
};

/**
 * Converts plain text to basic HTML format
 * @param {string} plainText - Plain text content
 * @returns {string} - HTML formatted content
 */
export const plainTextToHtml = (plainText) => {
    if (!plainText) return '';
    
    // Escape HTML entities first
    const escaped = plainText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    // Convert line breaks to paragraphs
    const paragraphs = escaped.split('\n').filter(p => p.trim());
    
    if (paragraphs.length === 0) return '';
    if (paragraphs.length === 1) return `<p>${paragraphs[0]}</p>`;
    
    return paragraphs.map(p => `<p>${p}</p>`).join('');
};

/**
 * Converts HTML content to plain text
 * @param {string} htmlContent - HTML content
 * @returns {string} - Plain text content
 */
export const htmlToPlainText = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Create a temporary DOM element to extract text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get text content and normalize whitespace
    return tempDiv.textContent?.replace(/\s+/g, ' ').trim() || '';
};

/**
 * Gets the character count of content (strips HTML if present)
 * @param {string} content - Content to count
 * @returns {number} - Character count
 */
export const getContentCharacterCount = (content) => {
    if (!content) return 0;
    
    if (hasRichFormatting(content)) {
        return htmlToPlainText(content).length;
    }
    
    return content.length;
};

/**
 * Validates if content is safe for display
 * @param {string} content - Content to validate
 * @returns {boolean} - True if content is safe
 */
export const isContentSafe = (content) => {
    if (!content) return true;
    
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
        /<object\b/gi,
        /<embed\b/gi,
        /<form\b/gi
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(content));
};

/**
 * Truncates content to a maximum length while preserving formatting
 * @param {string} content - Content to truncate
 * @param {number} maxLength - Maximum character length
 * @returns {string} - Truncated content
 */
export const truncateContent = (content, maxLength) => {
    if (!content || getContentCharacterCount(content) <= maxLength) {
        return content;
    }
    
    if (hasRichFormatting(content)) {
        const plainText = htmlToPlainText(content);
        const truncated = plainText.substring(0, maxLength - 3) + '...';
        return plainTextToHtml(truncated);
    }
    
    return content.substring(0, maxLength - 3) + '...';
}; 