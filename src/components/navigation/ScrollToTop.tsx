import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Force scroll to top on route changes
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Also scroll document.documentElement in case window scroll doesn't work
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    console.log('📍 ScrollToTop: Reset scroll position for route:', pathname + search);
  }, [pathname, search]);

  return null;
}