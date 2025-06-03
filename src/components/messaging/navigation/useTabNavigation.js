import { useNavigate } from 'react-router-dom';
import { useTabPersistence } from '../../../hooks/useTabPersistence';

/**
 * useTabNavigation - Custom hook for tab navigation logic
 * Handles tab switching and channel-specific tab configuration with persistence
 */
export const useTabNavigation = (channelId, channels) => {
  const navigate = useNavigate();
  const { getLastTab, getLastSubTab, saveTab, saveSubTab, saveMessagingState } = useTabPersistence();

  // Dynamic tabs based on channel type
  const getTabsForChannel = (channel) => {
    const baseTabs = [
      { id: 'messages', label: 'Messages' },
      { id: 'tasks', label: 'Tasks' },
      { id: 'wiki', label: 'Wiki' }
    ];

    // Only show Classes tab for channels with type "class"
    if (channel?.type === 'class') {
      baseTabs.splice(1, 0, { id: 'classes', label: 'Classes' });
    }

    // Only show Import tab for channels with type "import"
    if (channel?.type === 'import') {
      baseTabs.splice(1, 0, { id: 'import', label: 'Import' });
    }

    return baseTabs;
  };

  const handleTabSelect = (tab) => {
    if (!channelId) return;
    
    // Save the selected tab to persistence
    saveTab(channelId, tab.toLowerCase());
    
    // Navigate to the selected tab
    switch (tab.toLowerCase()) {
      case 'messages':
        navigate(`/channels/${channelId}/messages`);
        break;
      case 'tasks':
        navigate(`/channels/${channelId}/tasks`);
        break;
      case 'classes':
        // For classes tab, check if there's a saved sub-tab
        const lastSubTab = getLastSubTab(channelId, 'classes');
        const subTabPath = lastSubTab ? `/${lastSubTab}` : '';
        navigate(`/channels/${channelId}/classes${subTabPath}`);
        break;
      case 'import':
        navigate(`/channels/${channelId}/import`);
        break;
      case 'wiki':
        navigate(`/channels/${channelId}/wiki`);
        break;
      default:
        navigate(`/channels/${channelId}/messages`);
    }
  };

  const handleChannelSelect = (newChannelId) => {
    // Get the new channel and its available tabs
    const newChannel = channels.find(ch => ch.id === newChannelId);
    const availableTabs = getTabsForChannel(newChannel);
    
    // Get the last active tab for this channel
    const lastTab = getLastTab(newChannelId, availableTabs);
    
    // Navigate to the last active tab, or messages if none saved
    switch (lastTab) {
      case 'messages':
        navigate(`/channels/${newChannelId}/messages`);
        break;
      case 'tasks':
        navigate(`/channels/${newChannelId}/tasks`);
        break;
      case 'classes':
        // For classes tab, restore the last sub-tab if available
        const lastSubTab = getLastSubTab(newChannelId, 'classes');
        const subTabPath = lastSubTab ? `/${lastSubTab}` : '';
        navigate(`/channels/${newChannelId}/classes${subTabPath}`);
        break;
      case 'import':
        navigate(`/channels/${newChannelId}/import`);
        break;
      case 'wiki':
        navigate(`/channels/${newChannelId}/wiki`);
        break;
      default:
        navigate(`/channels/${newChannelId}/messages`);
    }
  };

  const handleSubTabSelect = (channelId, tab, subTab) => {
    if (!channelId || !tab || !subTab) return;
    
    // Save the selected sub-tab to persistence
    saveSubTab(channelId, tab, subTab);
  };

  return {
    getTabsForChannel,
    handleTabSelect,
    handleChannelSelect,
    handleSubTabSelect,
    getLastTab,
    getLastSubTab,
    saveMessagingState
  };
}; 