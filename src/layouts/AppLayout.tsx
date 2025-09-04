import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Library, Archive, Settings, LogOut, User, Circle, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import TabBar from '@/components/TabBar';
import { useTabsStore } from '@/store/tabs';
import { useTabs } from '@/hooks/useTabs';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addTab, setActiveTab, addToHistory, updateTab } = useTabsStore();
  const { navigateToTab } = useTabs();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle route changes and sync with tabs
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Add to navigation history
    addToHistory(currentPath);
    
    // Always update the current active tab's path and title
    const tabs = useTabsStore.getState().tabs;
    const currentActiveTab = tabs.find(tab => tab.id === useTabsStore.getState().activeTabId);
    
    if (currentActiveTab) {
      let newTitle = 'Home';
      let newIcon = 'Home';
      
      if (currentPath === '/app/library') {
        newTitle = 'Library';
        newIcon = 'Library';
      } else if (currentPath === '/app/archive') {
        newTitle = 'Archive';
        newIcon = 'Archive';
      } else if (currentPath === '/app/settings') {
        newTitle = 'Settings';
        newIcon = 'Settings';
      } else if (currentPath.startsWith('/app/session/')) {
        newTitle = 'Session';
        newIcon = 'FileText';
      }
      
      // Update the current tab's path and title
      updateTab(currentActiveTab.id, {
        path: currentPath,
        title: newTitle,
        icon: newIcon,
      });
    }
  }, [location.pathname, addTab, setActiveTab, addToHistory, updateTab]);

  const handleQuickNavigation = (path: string, title: string, icon: string) => {
    navigate(path);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar with logo and user controls */}
      <header className="h-12 bg-card border-b border-border px-4 flex items-center justify-between shrink-0">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Circle className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Polka</span>
        </div>

        {/* Quick navigation buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickNavigation('/app/home', 'Home', 'Home')}
            className="h-8 px-3 text-xs"
          >
            <Home className="w-4 h-4 mr-1" />
            Home
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickNavigation('/app/library', 'Library', 'Library')}
            className="h-8 px-3 text-xs"
          >
            <Library className="w-4 h-4 mr-1" />
            Library
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickNavigation('/app/archive', 'Archive', 'Archive')}
            className="h-8 px-3 text-xs"
          >
            <Archive className="w-4 h-4 mr-1" />
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleQuickNavigation('/app/settings', 'Settings', 'Settings')}
            className="h-8 px-3 text-xs"
          >
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
        </div>

        {/* User controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <motion.div
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </motion.div>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                <User className="w-3 h-3" />
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-3 h-3 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <TabBar />

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
