import { useState, useEffect, useCallback } from 'react';

const TAB_PERSISTENCE_KEY = 'chatter_channel_tab_state';
const GLOBAL_STATE_KEY = 'chatter_global_navigation_state';
const TAB_EXPIRY_DAYS = 30; // Tab preferences expire after 30 days

/**
 * useTabPersistence - Custom hook for persisting tab state per channel
 * Remembers the last active tab and sub-tab for each channel, plus global navigation state
 */
export const useTabPersistence = () => {
  const [tabState, setTabState] = useState({});
  const [globalState, setGlobalState] = useState({});

  // Load tab state from localStorage on mount
  useEffect(() => {
    try {
      const storedTabState = localStorage.getItem(TAB_PERSISTENCE_KEY);
      if (storedTabState) {
        const parsedTabState = JSON.parse(storedTabState);
        
        // Clean up expired tab states
        const now = Date.now();
        const validTabState = {};
        
        Object.entries(parsedTabState).forEach(([channelId, state]) => {
          const stateAge = now - (state.timestamp || 0);
          const maxAge = TAB_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
          
          if (stateAge < maxAge) {
            validTabState[channelId] = state;
          }
        });
        
        setTabState(validTabState);
        
        // Update localStorage with cleaned state
        if (Object.keys(validTabState).length !== Object.keys(parsedTabState).length) {
          localStorage.setItem(TAB_PERSISTENCE_KEY, JSON.stringify(validTabState));
        }
      }
    } catch (error) {
      console.error('Error loading tab state:', error);
      setTabState({});
    }
  }, []);

  // Load global navigation state from localStorage on mount
  useEffect(() => {
    try {
      const storedGlobalState = localStorage.getItem(GLOBAL_STATE_KEY);
      if (storedGlobalState) {
        const parsedGlobalState = JSON.parse(storedGlobalState);
        
        // Check if global state is not expired
        const now = Date.now();
        const stateAge = now - (parsedGlobalState.timestamp || 0);
        const maxAge = TAB_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        
        if (stateAge < maxAge) {
          setGlobalState(parsedGlobalState);
        } else {
          // Clear expired global state
          localStorage.removeItem(GLOBAL_STATE_KEY);
          setGlobalState({});
        }
      }
    } catch (error) {
      console.error('Error loading global state:', error);
      setGlobalState({});
    }
  }, []);

  // Save tab state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(TAB_PERSISTENCE_KEY, JSON.stringify(tabState));
    } catch (error) {
      console.error('Error saving tab state:', error);
    }
  }, [tabState]);

  // Save global state to localStorage whenever it changes
  useEffect(() => {
    try {
      if (Object.keys(globalState).length > 0) {
        localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(globalState));
      }
    } catch (error) {
      console.error('Error saving global state:', error);
    }
  }, [globalState]);

  // Get the last active tab for a channel
  const getLastTab = useCallback((channelId, availableTabs = []) => {
    if (!channelId || !tabState[channelId]) {
      return 'messages'; // Default to messages tab
    }

    const lastTab = tabState[channelId].tab;
    
    // Check if the last tab is still available for this channel
    const isTabAvailable = availableTabs.length === 0 || 
      availableTabs.some(tab => tab.id === lastTab);
    
    return isTabAvailable ? lastTab : 'messages';
  }, [tabState]);

  // Get the last active sub-tab for a channel and tab
  const getLastSubTab = useCallback((channelId, tab) => {
    if (!channelId || !tabState[channelId] || !tabState[channelId].subTabs) {
      return null;
    }

    return tabState[channelId].subTabs[tab] || null;
  }, [tabState]);

  // Save the current tab for a channel
  const saveTab = useCallback((channelId, tab) => {
    if (!channelId || !tab) return;

    setTabState(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        tab,
        timestamp: Date.now(),
        subTabs: prev[channelId]?.subTabs || {}
      }
    }));
  }, []);

  // Save the current sub-tab for a channel and tab
  const saveSubTab = useCallback((channelId, tab, subTab) => {
    if (!channelId || !tab) return;

    setTabState(prev => ({
      ...prev,
      [channelId]: {
        ...prev[channelId],
        tab: prev[channelId]?.tab || tab,
        timestamp: Date.now(),
        subTabs: {
          ...prev[channelId]?.subTabs,
          [tab]: subTab
        }
      }
    }));
  }, []);

  // Save the complete messaging state (channel + tab + sub-tab)
  const saveMessagingState = useCallback((channelId, tab, subTab = null) => {
    if (!channelId || !tab) return;

    setGlobalState(prev => ({
      ...prev,
      lastMessagingState: {
        channelId,
        tab,
        subTab,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    }));
  }, []);

  // Get the last complete messaging state
  const getLastMessagingState = useCallback(() => {
    return globalState.lastMessagingState || null;
  }, [globalState]);

  // Clear tab state for a specific channel (useful when channel is deleted)
  const clearChannelTabState = useCallback((channelId) => {
    if (!channelId) return;

    setTabState(prev => {
      const newState = { ...prev };
      delete newState[channelId];
      return newState;
    });
  }, []);

  // Clear all tab state (useful for logout or reset)
  const clearAllTabState = useCallback(() => {
    setTabState({});
    try {
      localStorage.removeItem(TAB_PERSISTENCE_KEY);
    } catch (error) {
      console.error('Error clearing tab state:', error);
    }
  }, []);

  // Clear global navigation state
  const clearGlobalState = useCallback(() => {
    setGlobalState({});
    try {
      localStorage.removeItem(GLOBAL_STATE_KEY);
    } catch (error) {
      console.error('Error clearing global state:', error);
    }
  }, []);

  // Get full tab state for debugging
  const getTabState = useCallback(() => {
    return tabState;
  }, [tabState]);

  // Get full global state for debugging
  const getGlobalState = useCallback(() => {
    return globalState;
  }, [globalState]);

  return {
    getLastTab,
    getLastSubTab,
    saveTab,
    saveSubTab,
    saveMessagingState,
    getLastMessagingState,
    clearChannelTabState,
    clearAllTabState,
    clearGlobalState,
    getTabState,
    getGlobalState
  };
}; 