// Google Analytics 4 (frontend only) — measurement ID comes from the Google Analytics connector.
const measurementId = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined;

type GtagArgs = unknown[];

const gtag = (...args: GtagArgs) => {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(args);
};

/** Loads gtag.js once at app startup. No-op when the measurement ID is absent. */
export const initAnalytics = () => {
  if (!measurementId || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  gtag('js', new Date());
  gtag('config', measurementId);
  (window as any).gtag = gtag;
};

/** Sends a page view for SPA route changes. */
export const trackPageView = (path: string) => {
  if (!measurementId) return;
  gtag('event', 'page_view', { page_path: path });
};

/** Sends a custom event (e.g. receipt_scan, expense_saved). */
export const trackEvent = (name: string, params: Record<string, unknown> = {}) => {
  if (!measurementId) return;
  gtag('event', name, params);
};
