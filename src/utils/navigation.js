/**
 * Navigation utilities for handling middle-click functionality
 */

/**
 * Handles middle-click events to open URLs in new tabs
 * @param {MouseEvent} event - The mouse event
 * @param {string} url - The URL to open
 * @param {Function} normalClickHandler - The normal click handler to call for left clicks
 */
export const handleMiddleClick = (event, url, normalClickHandler) => {
  // Check if it's a middle-click (button 1) or Ctrl+click
  if (event.button === 1 || (event.button === 0 && (event.ctrlKey || event.metaKey))) {
    event.preventDefault();
    event.stopPropagation();
    window.open(url, '_blank');
  } else if (event.button === 0 && normalClickHandler) {
    // Normal left click
    normalClickHandler();
  }
};

/**
 * Generates URL for channel navigation
 * @param {string} channelId - The channel ID
 * @param {string} tab - The tab name (optional, defaults to 'messages')
 * @param {string} subTab - The sub-tab name (optional)
 * @returns {string} The complete URL
 */
export const generateChannelUrl = (channelId, tab = 'messages', subTab = null) => {
  let url = `/channels/${channelId}/${tab}`;
  if (subTab && tab === 'classes') {
    url += `/${subTab}`;
  }
  return url;
};

/**
 * Generates URL for main app sections
 * @param {string} section - The section name ('messaging', 'crm', 'bookkeeping')
 * @param {Object} options - Additional options for messaging section
 * @returns {string} The complete URL
 */
export const generateSectionUrl = (section, options = {}) => {
  switch (section) {
    case 'messaging':
      if (options.channelId) {
        return generateChannelUrl(options.channelId, options.tab, options.subTab);
      }
      return '/channels';
    case 'crm':
      return '/crm';
    case 'bookkeeping':
      return '/bookkeeping';
    default:
      return '/';
  }
};

/**
 * Adds middle-click event listeners to a button element
 * @param {string} url - The URL to open on middle-click
 * @param {Function} normalClickHandler - The normal click handler
 * @returns {Object} Event handlers object
 */
export const getMiddleClickHandlers = (url, normalClickHandler) => ({
  onMouseDown: (event) => handleMiddleClick(event, url, normalClickHandler),
  onAuxClick: (event) => {
    // Handle middle-click on browsers that support auxclick
    if (event.button === 1) {
      event.preventDefault();
      event.stopPropagation();
      window.open(url, '_blank');
    }
  }
}); 