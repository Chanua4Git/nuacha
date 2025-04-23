
import React, { createContext, useContext, useEffect, useState } from 'react';
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authDemoActive, setAuthDemoActiveRaw] = useState(isAuthDemoActive()); // Demo flow state

  const navigate = useNavigate();
  const location = useLocation();

  const setAuthDemoActiveSync = (active: boolean) => {
    if (active) {
      setAuthDemoActive();
      setAuthDemoActiveRaw(true);
    } else {
      clearAuthDemo();
      setAuthDemoActiveRaw(false);
    }
  };

  useEffect(() => {
    const newActive = shouldEnableAuthDemo(location);
    if (newActive !== authDemoActive) {
      setAuthDemoActiveSync(newActive);
    }
    if (!newActive && authDemoActive && !location.pathname.startsWith('/auth-demo')) {
      setAuthDemoActiveSync(false);
    }
    // eslint-disable-next-line
  }, [location]);

  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        const searchParams = new URLSearchParams(window.location.search);
        const isEmailVerified = searchParams.get("verified") === "true";
        const isFromAuthDemo = searchParams.get("from") === "auth-demo";

        // Handle auth demo verification flow
        if (isEmailVerified && isFromAuthDemo) {
          setAuthDemoActiveSync(true);
          window.history.replaceState({}, "", "/");
          return;
        }

        if (event === 'SIGNED_IN') {
          if (isAuthDemoActive()) {
            if (!location.pathname.startsWith('/auth-demo')) {
              navigate('/', { replace: true });
            }
          } else {
            const intendedPath = safeGetIntendedPath();
            localStorage.removeItem('intendedPath');
            if (location.pathname !== intendedPath) {
              navigate(intendedPath, { replace: true });
            }
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
        console.error('Error loading session:', err);
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
      console.error('Error signing out:', error);
    } finally {
      setSession(null);
      setUser(null);
      setTimeout(() => {
        if (isAuthDemoActive()) {
          navigate('/auth-demo', { replace: true });
        } else {
          navigate('/login', { replace: true });
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
