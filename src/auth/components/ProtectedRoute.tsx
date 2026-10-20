
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { Link, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function welcomeFor(path: string, search: string) {
  if (path.startsWith('/options')) return { title: 'Set up your household', body: 'Create your family and add the people you spend for, so every expense finds its home.' };
  if (path.startsWith('/budget')) return { title: 'Set a soft budget', body: 'A gentle monthly plan per category. No pressure, just clarity.' };
  if (path.startsWith('/payroll') && search.includes('calculator')) return { title: 'Check your NIS before you pay', body: 'See employee and employer amounts side by side, worked out for you.' };
  if (path.startsWith('/payroll')) return { title: 'Pay your people', body: 'Record a shift, log the rate, and send a payslip they can read on their phone.' };
  return { title: 'A softer way to track spending', body: 'Sign in or create a free account to pick up right here.' };
}

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
    const w = welcomeFor(location.pathname, location.search);
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-background to-accent/20">
        <div className="max-w-md w-full rounded-3xl bg-card shadow-sm border p-8 text-center space-y-5">
          <p className="text-sm text-muted-foreground">Welcome to Nuacha 🌿</p>
          <h1 className="text-3xl font-serif">{w.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{w.body}</p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild size="lg" className="rounded-2xl"><Link to="/signup">Create a free account</Link></Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl"><Link to="/login">I already have an account</Link></Button>
          </div>
          <p className="text-xs text-muted-foreground">We'll bring you right back here once you're in.</p>
          <Link to="/?start=scan" className="text-sm underline text-primary">Or try a free receipt scan first</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
