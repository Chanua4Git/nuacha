// Google Analytics 4 (frontend only) — measurement ID comes from the Google Analytics connector.
const measurementId = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined;

declare global {
  interface Window { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
}

// gtag.js requires the native `arguments` object — pushing a plain array is silently ignored.
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

/** Loads gtag.js once at app startup. No-op when the measurement ID is absent. */
export const initAnalytics = () => {
  if (!measurementId || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.gtag = gtag;
  gtag('set', 'developer_id.dZjgwMW', true);
  gtag('js', new Date());
  gtag('config', measurementId);
};

/** Sends a page view for SPA route changes. */
export const trackPageView = (path: string) => {
  if (!measurementId) return;
  gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
};

/** Sends a custom event (e.g. sign_up, first_scan). */
export const trackEvent = (name: string, params: Record<string, unknown> = {}) => {
  if (!measurementId) return;
  gtag('event', name, params);
};

/** Ties events to a signed-in user so a person's journey can be followed. */
export const identifyUser = (userId: string | null) => {
  if (!measurementId) return;
  gtag('config', measurementId, { user_id: userId ?? undefined, send_page_view: false });
};
