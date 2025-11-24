
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '../utils/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
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
const APP_ROUTES = ['/app', '/dashboard', '/options', '/reports', '/reminders', '/payroll', '/budget', '/receipts'];

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

  const safeNavigate = (path: string, options: { replace?: boolean } = {}) => {
    // Prevent multiple navigations in quick succession
    if (navigationInProgress.current) return;
    
    // Don't navigate if already on the target path
    if (location.pathname === path) return;
    
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
          console.log('🔐 Auth: SIGNED_IN event, current path:', location.pathname);
          
          // Check if this is a new user (created within last 5 minutes)
          if (currentSession?.user?.created_at) {
            const userCreatedAt = new Date(currentSession.user.created_at);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isNewUser = userCreatedAt > fiveMinutesAgo;
            
            if (!isNewUser) {
              toast.success("Welcome back! We've signed you in with your existing account.");
              console.log('🔐 Auth: Existing user signed in');
            }
          }
          
          const verificationComplete = localStorage.getItem("verificationComplete") === "true";
          
          if (verificationComplete) {
            localStorage.removeItem("verificationComplete");
            safeNavigate("/", { replace: true });
            return;
          }

          if (isAuthDemoActive()) {
            if (!location.pathname.startsWith('/authentication-demo')) {
              safeNavigate('/authentication-demo', { replace: true });
            }
          } else {
            // Check for intended path first, prioritizing user's intended destination
            const intendedPath = safeGetIntendedPath();
            console.log('🔐 Auth: intended path:', intendedPath, 'current path:', location.pathname);
            
            // Check for pending upload state from sessionStorage
            const pendingState = sessionStorage.getItem('pendingUploadState');
            let stateToPass: any = undefined;

            if (pendingState) {
              try {
                stateToPass = JSON.parse(pendingState);
                sessionStorage.removeItem('pendingUploadState');
                console.log('🔐 Auth: Restored pending upload state:', stateToPass);
              } catch (e) {
                sessionStorage.removeItem('pendingUploadState');
                console.error('Failed to parse pending upload state');
              }
            }
            
            // If user has an intended path, use it regardless of current location
            if (intendedPath !== "/" && localStorage.getItem('intendedPath')) {
              localStorage.removeItem('intendedPath');
              navigate(intendedPath, { replace: true, state: stateToPass });
              return;
            }
            
            // If already on a valid app route and no specific intended path, stay here
            if (isAppRoute(location.pathname)) {
              localStorage.removeItem('intendedPath'); // Clean up any stale intended path
              console.log('🔐 Auth: staying on current app route:', location.pathname);
              return;
            }
            
            // Default fallback
            console.log('🔐 Auth: fallback navigation to root');
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
