import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Only scroll to top when the actual pathname changes (not search params)
    // This prevents scroll reset during receipt scanning when state changes
    if (previousPathname.current !== pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      console.log('📍 ScrollToTop: Reset scroll position for route:', pathname);
      previousPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}