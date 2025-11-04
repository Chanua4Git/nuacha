
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Sanitize pathname to defend against open redirects
function sanitizePath(path: string): string {
  if (!path.startsWith("/")) return "/";
  // Prevent double slashes, spaces, or dangerous fragments, but preserve query params
  const cleanPath = path.replace(/\/{2,}/g, "/").replace(/[\r\n]/g, "");
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
      // Save a sanitized attempted URL, prefer the most specific (with query) and when state exists
      const current = sanitizePath(location.pathname + location.search);
      const hasState = !!(location.state && Object.keys(location.state).length > 0);
      const saved = localStorage.getItem('intendedPath');
      if (current !== "/login" && current !== "/signup") {
        if (!saved || hasState || (saved !== current && current.includes('?'))) {
          localStorage.setItem('intendedPath', current);
        }
      }
      
      // Preserve location state (OCR data) during authentication redirect
      if (hasState) {
        sessionStorage.setItem('pendingUploadState', JSON.stringify(location.state));
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
