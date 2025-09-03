import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Library, Mic, Settings, LogOut, User, Menu, X, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/app/home', icon: Home },
  { name: 'Library', href: '/app/library', icon: Library },
  { name: 'Sessions', href: '/app/sessions', icon: Mic },
  { name: 'Settings', href: '/app/settings', icon: Settings },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPath = location.pathname;

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar */}
      <motion.div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-70 bg-card border-r border-border lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Circle className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Polka</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start space-x-3 h-12 px-3 text-left",
                      isActive
                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="lg:block">{item.name}</span>
                  </Button>
                </motion.div>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 lg:block">
                <p className="text-sm font-medium text-foreground truncate">
                  Student User
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  test@polka.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden lg:block">
              <h1 className="text-lg font-semibold text-foreground">
                {navigation.find(item => item.href === currentPath)?.name || 'Home'}
              </h1>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
