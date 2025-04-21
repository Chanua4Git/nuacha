
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabaseClient } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Defensive: Returns normalized "/" if anything goes wrong
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
  const navigate = useNavigate();

  const signOut = async () => {
    try {
      await supabaseClient.auth.signOut();
    } catch (error) {
      // Log error but proceed, and always reset state
      console.error('Error signing out:', error);
    } finally {
      setSession(null);
      setUser(null);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 50);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
        // Log for debugging session changes
        // eslint-disable-next-line no-console
        console.log("[Supabase Auth] Event:", event, "Session:", currentSession);
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
  }, [navigate]);

  // If user/session changes, clean up intendedPath if authenticated
  useEffect(() => {
    if (user && session) {
      // Remove intendedPath to prevent accidental reuse
      localStorage.removeItem("intendedPath");
    }
  }, [user, session]);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
