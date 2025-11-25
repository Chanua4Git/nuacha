import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useSearchParams } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';

type AuthPreviewContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isPreviewMode: boolean;
};

const AuthPreviewContext = createContext<AuthPreviewContextType | null>(null);

export const useAuthPreview = () => {
  const context = useContext(AuthPreviewContext);
  if (!context) {
    throw new Error('useAuthPreview must be used within AuthPreviewProvider');
  }
  return context;
};

export const AuthPreviewProvider = ({ children }: { children: ReactNode }) => {
  const realAuth = useAuth();
  const [searchParams] = useSearchParams();
  
  // Check if preview mode is active via URL parameter
  const isPreviewMode = searchParams.get('_preview_auth') === 'false';
  
  const value = useMemo<AuthPreviewContextType>(() => {
    if (isPreviewMode) {
      // Override auth to simulate unauthenticated state
      return {
        session: null,
        user: null,
        isLoading: false,
        isPreviewMode: true
      };
    }
    
    // Pass through real auth state
    return {
      session: realAuth.session,
      user: realAuth.user,
      isLoading: realAuth.isLoading,
      isPreviewMode: false
    };
  }, [isPreviewMode, realAuth.session, realAuth.user, realAuth.isLoading]);
  
  return (
    <AuthPreviewContext.Provider value={value}>
      {children}
    </AuthPreviewContext.Provider>
  );
};
