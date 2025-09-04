import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabsStore } from '@/store/tabs';

export const useTabs = () => {
  const navigate = useNavigate();
  const { addTab, updateTab, addToHistory } = useTabsStore();

  const openSessionTab = useCallback((sessionId: string, sessionTitle: string) => {
    try {
      const path = `/app/session/${sessionId}`;
      const state = useTabsStore.getState();
      const currentActiveTab = state.tabs.find(tab => tab.id === state.activeTabId);
      
      if (currentActiveTab) {
        // Update the current active tab instead of creating a new one
        updateTab(currentActiveTab.id, {
          title: sessionTitle,
          path,
          icon: 'FileText',
        });
      } else {
        // Fallback: create a new tab if no active tab exists
        const tabId = addTab({
          title: sessionTitle,
          path,
          icon: 'FileText',
          closable: true,
        });
        navigate(path);
        addToHistory(path);
        return tabId;
      }
      
      navigate(path);
      addToHistory(path);
      return currentActiveTab?.id || null;
    } catch (error) {
      console.error('Error opening session tab:', error);
      // Fallback to direct navigation
      navigate(`/app/session/${sessionId}`);
      return null;
    }
  }, [addTab, updateTab, navigate, addToHistory]);

  const openTab = useCallback((title: string, path: string, icon?: string) => {
    try {
      const tabId = addTab({
        title,
        path,
        icon,
        closable: true,
      });
      navigate(path);
      addToHistory(path);
      return tabId;
    } catch (error) {
      console.error('Error opening tab:', error);
      navigate(path);
      return null;
    }
  }, [addTab, navigate, addToHistory]);

  const updateSessionTab = useCallback((sessionId: string, newTitle: string) => {
    try {
      const tabs = useTabsStore.getState().tabs;
      const sessionTab = tabs.find(tab => tab.path === `/app/session/${sessionId}`);
      if (sessionTab) {
        updateTab(sessionTab.id, { title: newTitle });
      }
    } catch (error) {
      console.error('Error updating session tab:', error);
    }
  }, [updateTab]);

  const navigateToTab = useCallback((path: string) => {
    navigate(path);
    addToHistory(path);
  }, [navigate, addToHistory]);

  const openNotesTab = useCallback((sessionId: string, title: string) => {
    try {
      const path = `/app/notes/${sessionId}`;
      const tabId = addTab({
        title,
        path,
        icon: 'MessageCircle',
        closable: true,
      });
      navigate(path);
      addToHistory(path);
      return tabId;
    } catch (error) {
      console.error('Error opening notes tab:', error);
      navigate(`/app/notes/${sessionId}`);
      return null;
    }
  }, [addTab, navigate, addToHistory]);

  const openTranscriptTab = useCallback((sessionId: string, title: string) => {
    try {
      const path = `/app/transcript/${sessionId}`;
      const tabId = addTab({
        title,
        path,
        icon: 'FileText',
        closable: true,
      });
      navigate(path);
      addToHistory(path);
      return tabId;
    } catch (error) {
      console.error('Error opening transcript tab:', error);
      navigate(`/app/transcript/${sessionId}`);
      return null;
    }
  }, [addTab, navigate, addToHistory]);

  return {
    openSessionTab,
    openTab,
    updateSessionTab,
    navigateToTab,
    openNotesTab,
    openTranscriptTab,
  };
};

export default useTabs;
