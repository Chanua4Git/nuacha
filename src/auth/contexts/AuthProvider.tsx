
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '../utils/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  setAuthDemoActive,
  clearAuthDemo,
  isAuthDemoActive,
  shouldEnableAuthDemo,
  getVerifiedFromSearch,
} from '../utils/authDemoHelpers';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  authDemoActive: boolean;
  setAuthDemoActive: (active: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
  authDemoActive: false,
  setAuthDemoActive: () => {},
});

export const useAuth = () => useContext(AuthContext);

// List of app routes that should be preserved when user is authenticated
const APP_ROUTES = ['/app', '/dashboard', '/options', '/reports', '/reminders', '/payroll'];

function safeGetIntendedPath(): string {
  try {
    const path = localStorage.getItem("intendedPath");
    if (!path) return "/";
    if (!path.startsWith("/")) return "/";
    return path.replace(/\/{2,}/g, "/").replace(/[\r\n]/g, "");
  } catch {
    return "/";
  }
}

// Function to check if the current path is a protected app route
function isAppRoute(path: string): boolean {
  return APP_ROUTES.some(route => path === route || path.startsWith(`${route}/`));
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authDemoActive, setAuthDemoActiveRaw] = useState(isAuthDemoActive()); // Demo flow state
  const urlParamsProcessed = useRef(false);
  const navigationInProgress = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Safely navigate to prevent multiple redirects
  const safeNavigate = (path: string, options: { replace?: boolean } = {}) => {
    // Prevent multiple navigations in quick succession
    if (navigationInProgress.current) return;
    
    // Don't navigate if user is already on an app route and is authenticated
    if (user && isAppRoute(location.pathname) && isAppRoute(path)) {
      return;
    }
    
    navigationInProgress.current = true;
    navigate(path, options);
    
    // Reset after a short delay
    setTimeout(() => {
      navigationInProgress.current = false;
    }, 300);
  };

  const setAuthDemoActiveSync = (active: boolean) => {
    if (active) {
      setAuthDemoActive();
      setAuthDemoActiveRaw(true);
    } else {
      clearAuthDemo();
      setAuthDemoActiveRaw(false);
    }
  };

  // Handle URL parameters and demo state
  useEffect(() => {
    if (urlParamsProcessed.current) return;

    const searchParams = new URLSearchParams(window.location.search);
    const isEmailVerified = searchParams.get("verified") === "true";
    const isFromAuthDemo = searchParams.get("from") === "auth-demo";

    if (isEmailVerified && isFromAuthDemo) {
      // Process verification first to avoid race conditions
      setAuthDemoActiveSync(true);
      localStorage.setItem("verificationComplete", "true");
      urlParamsProcessed.current = true;
    }
  }, [location]);

  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN') {
          const verificationComplete = localStorage.getItem("verificationComplete") === "true";
          
          if (verificationComplete) {
            localStorage.removeItem("verificationComplete");
            window.history.replaceState({}, "", "/");
            safeNavigate("/", { replace: true });
            return;
          }

            if (isAuthDemoActive()) {
              if (!location.pathname.startsWith('/authentication-demo')) {
                safeNavigate('/', { replace: true });
              }
            } else {
            // Check for intended path first, prioritizing user's intended destination
            const intendedPath = safeGetIntendedPath();
            
            // If user has an intended path, use it regardless of current location
            if (intendedPath !== "/" && localStorage.getItem('intendedPath')) {
              localStorage.removeItem('intendedPath');
              safeNavigate(intendedPath, { replace: true });
              return;
            }
            
            // If already on a valid app route and no specific intended path, stay here
            if (isAppRoute(location.pathname)) {
              localStorage.removeItem('intendedPath'); // Clean up any stale intended path
              return;
            }
            
            // Default fallback
            safeNavigate("/", { replace: true });
          }
        }
      }
    );

    supabaseClient.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && session && !authDemoActive) {
      localStorage.removeItem("intendedPath");
    }
  }, [user, session, authDemoActive]);

  const signOut = async () => {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      // Handle sign out error silently
    } finally {
      setSession(null);
      setUser(null);
      setTimeout(() => {
        if (isAuthDemoActive()) {
          safeNavigate('/authentication-demo', { replace: true });
        } else {
          safeNavigate('/app', { replace: true });
        }
      }, 50);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      isLoading,
      signOut,
      authDemoActive,
      setAuthDemoActive: setAuthDemoActiveSync
    }}>
      {children}
    </AuthContext.Provider>
  );
};
