import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AppLayout from '@/layouts/AppLayout';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Session from '@/pages/Session';
import Settings from '@/pages/Settings';
import Archive from '@/pages/Archive';
import Library from '@/pages/Library';
import "./App.css";

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
                    <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
        <Route path="home" element={<Home />} />
        <Route path="session/:id" element={<Session />} />
        <Route path="library" element={<Library />} />
        <Route path="archive" element={<Archive />} />
        <Route path="settings" element={<Settings />} />
        <Route index element={<Navigate to="/app/home" replace />} />
      </Route>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/app/home" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
