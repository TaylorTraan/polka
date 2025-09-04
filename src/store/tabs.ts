import { create } from 'zustand';
import { nanoid } from 'nanoid';

export interface Tab {
  id: string;
  title: string;
  path: string;
  icon?: string;
  closable?: boolean;
}

interface TabsStore {
  tabs: Tab[];
  activeTabId: string | null;
  history: string[];
  historyIndex: number;
  
  // Actions
  addTab: (tab: Omit<Tab, 'id'>) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  navigateBack: () => boolean;
  navigateForward: () => boolean;
  canNavigateBack: () => boolean;
  canNavigateForward: () => boolean;
  addToHistory: (path: string) => void;
  clearHistory: () => void;
}

export const useTabsStore = create<TabsStore>((set, get) => ({
  tabs: [
    {
      id: 'home',
      title: 'Home',
      path: '/app/home',
      icon: 'Home',
      closable: false,
    },
  ],
  activeTabId: 'home',
  history: ['/app/home'],
  historyIndex: 0,

  addTab: (tabData) => {
    const id = nanoid();
    const newTab: Tab = {
      id,
      closable: true,
      ...tabData,
    };

    set((state) => {
      // Always create a new tab, don't check for existing tabs
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: id,
      };
    });

    return id;
  },

  closeTab: (tabId) => {
    set((state) => {
      const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
      if (tabIndex === -1 || !state.tabs[tabIndex].closable) return state;

      const newTabs = state.tabs.filter(tab => tab.id !== tabId);
      let newActiveTabId = state.activeTabId;

      // If we're closing the active tab, switch to another tab
      if (state.activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Try to activate the tab to the right, or left if no tab to the right
          const nextTab = newTabs[tabIndex] || newTabs[tabIndex - 1] || newTabs[0];
          newActiveTabId = nextTab.id;
        } else {
          newActiveTabId = null;
        }
      }

      return {
        ...state,
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    });
  },

  setActiveTab: (tabId) => {
    set((state) => ({
      ...state,
      activeTabId: tabId,
    }));
  },

  updateTab: (tabId, updates) => {
    set((state) => ({
      ...state,
      tabs: state.tabs.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    }));
  },

  navigateBack: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        historyIndex: newIndex,
      });
      return true;
    }
    return false;
  },

  navigateForward: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        historyIndex: newIndex,
      });
      return true;
    }
    return false;
  },

  canNavigateBack: () => {
    const state = get();
    return state.historyIndex > 0;
  },

  canNavigateForward: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },

  addToHistory: (path) => {
    set((state) => {
      // Don't add duplicate consecutive entries
      if (state.history[state.historyIndex] === path) {
        return state;
      }

      // If we're not at the end of history, truncate forward history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(path);

      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  clearHistory: () => {
    set({
      history: ['/app/home'],
      historyIndex: 0,
    });
  },
}));
