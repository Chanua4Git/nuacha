
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Sanitize pathname to defend against open redirects
function sanitizePath(path: string): string {
  if (!path.startsWith("/")) return "/";
  // Prevent double slashes, spaces, or dangerous fragments
  const cleanPath = path.replace(/\/{2,}/g, "/").replace(/[\r\n]/g, "").split("?")[0];
  return cleanPath || "/";
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user && !isLoading) {
      // Save a sanitized attempted URL only if not already set
      const current = sanitizePath(location.pathname);
      const saved = localStorage.getItem('intendedPath');
      if (!saved && current !== "/login" && current !== "/signup") {
        localStorage.setItem('intendedPath', current);
      }
    }
  }, [user, isLoading, location]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white" data-testid="loading-auth">
        <div className="flex flex-col items-center gap-4" role="status">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your account…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
