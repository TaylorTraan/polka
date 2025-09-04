import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTabsStore } from '@/store/tabs';

export const useTabs = () => {
  const navigate = useNavigate();
  const { addTab, updateTab, addToHistory } = useTabsStore();

  const openSessionTab = useCallback((sessionId: string, sessionTitle: string) => {
    try {
      const path = `/app/session/${sessionId}`;
      const tabId = addTab({
        title: sessionTitle,
        path,
        icon: 'FileText',
        closable: true,
      });
      navigate(path);
      addToHistory(path);
      return tabId;
    } catch (error) {
      console.error('Error opening session tab:', error);
      // Fallback to direct navigation
      navigate(`/app/session/${sessionId}`);
      return null;
    }
  }, [addTab, navigate, addToHistory]);

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

  return {
    openSessionTab,
    openTab,
    updateSessionTab,
    navigateToTab,
  };
};

export default useTabs;
