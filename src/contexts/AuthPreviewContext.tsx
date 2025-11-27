import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';

type AuthPreviewContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isPreviewMode: boolean;
  isActuallyAuthenticated: boolean;
};

// Admin routes that should always use real auth (never preview mode)
const ADMIN_ROUTES = ['/updates'];
const ADMIN_PARAMS = ['tab=admin'];

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
  const location = useLocation();
  
  // Check if preview mode is requested via URL parameter
  const previewModeRequested = searchParams.get('_preview_auth') === 'false';
  
  // Check if current route/params are admin-only (should ignore preview mode)
  const isAdminContext = useMemo(() => {
    const isAdminRoute = ADMIN_ROUTES.some(route => location.pathname.startsWith(route));
    const hasAdminParam = ADMIN_PARAMS.some(param => location.search.includes(param));
    return isAdminRoute && hasAdminParam;
  }, [location.pathname, location.search]);
  
  // Preview mode is active only if requested AND not in admin context
  const isPreviewMode = previewModeRequested && !isAdminContext;
  
  const value = useMemo<AuthPreviewContextType>(() => {
    if (isPreviewMode) {
      // Override auth to simulate unauthenticated state for preview
      return {
        session: null,
        user: null,
        isLoading: false,
        isPreviewMode: true,
        isActuallyAuthenticated: !!realAuth.user
      };
    }
    
    // Pass through real auth state
    return {
      session: realAuth.session,
      user: realAuth.user,
      isLoading: realAuth.isLoading,
      isPreviewMode: false,
      isActuallyAuthenticated: !!realAuth.user
    };
  }, [isPreviewMode, realAuth.session, realAuth.user, realAuth.isLoading]);
  
  return (
    <AuthPreviewContext.Provider value={value}>
      {children}
    </AuthPreviewContext.Provider>
  );
};
