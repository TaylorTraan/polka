import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Home, 
  Library, 
  Archive, 
  Settings,
  FileText,
  Plus,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components';
import { useTabsStore, Tab } from '@/store/tabs';
import { useNavigate } from 'react-router-dom';

const iconMap = {
  Home,
  Library,
  Archive,
  Settings,
  FileText,
  MessageCircle,
};

export default function TabBar() {
  const navigate = useNavigate();
  // const location = useLocation();
  const {
    tabs,
    activeTabId,
    setActiveTab,
    closeTab,
    addTab,
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    addToHistory,
  } = useTabsStore();

  const handleTabClick = (tab: Tab) => {
    if (tab.id !== activeTabId) {
      setActiveTab(tab.id);
      navigate(tab.path);
      addToHistory(tab.path);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleNavigateBack = () => {
    if (navigateBack()) {
      const state = useTabsStore.getState();
      const currentPath = state.history[state.historyIndex];
      navigate(currentPath);
    }
  };

  const handleNavigateForward = () => {
    if (navigateForward()) {
      const state = useTabsStore.getState();
      const currentPath = state.history[state.historyIndex];
      navigate(currentPath);
    }
  };

  const handleNewTab = () => {
    try {
      const tabId = addTab({
        title: 'Home',
        path: '/app/home',
        icon: 'Home',
        closable: true,
      });
      console.log('Created new tab with ID:', tabId);
      setActiveTab(tabId);
      navigate('/app/home');
      addToHistory('/app/home');
    } catch (error) {
      console.error('Error creating new tab:', error);
    }
  };

  const getTabIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  return (
    <div className="bg-background border-b border-border">
      <div className="flex items-center h-12 px-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-1 mr-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNavigateBack}
            disabled={!canNavigateBack()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNavigateForward}
            disabled={!canNavigateForward()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center flex-1 overflow-x-auto">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const Icon = getTabIcon(tab.icon);

              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`
                    relative flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer
                    transition-colors duration-200 min-w-0 max-w-48
                    ${isActive 
                      ? 'bg-card border-t border-l border-r border-border text-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                  onClick={() => handleTabClick(tab)}
                >
                  {Icon && <span className="shrink-0">{Icon}</span>}
                  <span className="truncate text-sm font-medium">
                    {tab.title}
                  </span>
                  
                  {tab.closable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 shrink-0 hover:bg-muted-foreground/20"
                      onClick={(e) => handleCloseTab(e, tab.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}

                  {/* Active tab indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
              );
            })}
            
            {/* New Tab Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={handleNewTab}
              title="New Tab"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Window Controls (optional, for future use) */}
        <div className="flex items-center gap-1 ml-4">
          {/* Could add minimize/maximize/close buttons here */}
        </div>
      </div>
    </div>
  );
}
