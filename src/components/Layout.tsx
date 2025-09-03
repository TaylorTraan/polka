import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export function Layout() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Polka</h2>
          <nav className="space-y-2">
            <a href="/app/home" className="block px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent">
              Home
            </a>
            {/* Add more nav items here */}
          </nav>
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}
