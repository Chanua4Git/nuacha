import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '../utils/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

// --- DEMO MODE HELPERS ---
function getAuthDemoActiveFromLS(): boolean {
  return localStorage.getItem('authDemoActive') === 'true';
}
function setAuthDemoActiveToLS(active: boolean) {
  if (active) {
    localStorage.setItem('authDemoActive', 'true');
  } else {
    localStorage.removeItem('authDemoActive');
  }
}
function shouldEnableAuthDemo(location: { search: string; pathname: string }) {
  // By convention, any route containing 'from=auth-demo' is considered demo flow
  return location.search.includes('from=auth-demo') ||
    location.pathname.startsWith('/auth-demo');
}

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
  const [authDemoActive, setAuthDemoActiveRaw] = useState(getAuthDemoActiveFromLS()); // Demo flow state

  const navigate = useNavigate();
  const location = useLocation();

  // Custom setter to sync LS and state
  const setAuthDemoActive = (active: boolean) => {
    setAuthDemoActiveToLS(active);
    setAuthDemoActiveRaw(active);
  };

  // Persist/capture demo flow on mount or navigation changes
  useEffect(() => {
    const newActive = shouldEnableAuthDemo(location);
    if (newActive !== authDemoActive) {
      setAuthDemoActive(newActive);
    }
    // Best effort: keep demo status in sync if someone arrives directly to demo page
    if (!newActive && authDemoActive && !location.pathname.startsWith('/auth-demo')) {
      setAuthDemoActive(false);
    }
    // eslint-disable-next-line
  }, [location]);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        // Special: if auth-demo, DO NOT auto-redirect to dashboard
        // Otherwise, use login redirect logic as before (safeGetIntendedPath etc)
        if (event === 'SIGNED_IN') {
          if (getAuthDemoActiveFromLS()) {
            // Stay in the demo flow: redirect to /auth-demo, NOT dashboard
            if (!location.pathname.startsWith('/auth-demo')) {
              navigate('/auth-demo', { replace: true });
            }
          } else {
            // Normal: redirect to intendedPath or /
            const intendedPath = safeGetIntendedPath();
            localStorage.removeItem('intendedPath');
            if (location.pathname !== intendedPath) {
              navigate(intendedPath, { replace: true });
            }
          }
        }
      }
    );

    // THEN check for existing session
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
  // We want to run this only once—DO NOT add location as a dep; would cause double nav
  // eslint-disable-next-line
  }, []);

  // If user/session changes, clean up intendedPath if authenticated
  useEffect(() => {
    if (user && session && !authDemoActive) {
      localStorage.removeItem("intendedPath");
    }
  }, [user, session, authDemoActive]);

  // When leaving demo mode (sign out, nav away): clear demo marker!
  const signOut = async () => {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setSession(null);
      setUser(null);
      setTimeout(() => {
        // Explicitly clear demo flow when signing out from demo context
        setAuthDemoActive(false);
        if (getAuthDemoActiveFromLS()) {
          setAuthDemoActive(false);
        }
        navigate('/login', { replace: true });
      }, 50);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut, authDemoActive, setAuthDemoActive }}>
      {children}
    </AuthContext.Provider>
  );
};
