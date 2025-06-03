import { useLocation, useParams } from 'react-router-dom';

/**
 * useRouteInfo - Custom hook for parsing route information
 * Extracts tab and content info from URL for navigation state
 */
export const useRouteInfo = () => {
  const location = useLocation();
  const params = useParams();
  
  // Extract route segments
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Determine current tab from URL
  let currentTab = 'messages'; // default
  let contentType = null;
  let contentId = null;
  let subTab = null;
  
  if (pathSegments.length >= 3) {
    const tabSegment = pathSegments[2]; // channels/channelId/[tab]
    
    switch (tabSegment) {
      case 'messages':
        currentTab = 'messages';
        if (pathSegments[3] === 'thread' && pathSegments[4]) {
          contentType = 'thread';
          contentId = pathSegments[4];
        }
        break;
      case 'tasks':
        currentTab = 'tasks';
        if (pathSegments[3]) {
          contentType = 'task';
          contentId = pathSegments[3];
        }
        break;
      case 'classes':
        currentTab = 'classes';
        if (pathSegments[3]) {
          subTab = pathSegments[3]; // courses or info
        }
        break;
      case 'import':
        currentTab = 'import';
        // Import tab doesn't have sub-navigation yet
        break;
      case 'wiki':
        currentTab = 'wiki';
        if (pathSegments[3]) {
          contentType = 'page';
          contentId = pathSegments[3];
        }
        break;
      default:
        // For any unknown tab segment, default to messages
        currentTab = 'messages';
        break;
    }
  }
  
  return {
    currentTab,
    contentType,
    contentId,
    subTab,
    channelId: params.channelId
  };
}; 