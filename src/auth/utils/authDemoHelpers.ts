
export const AUTH_DEMO_KEY = "authDemoActive";

/** Set demo mode to active in localStorage */
export const setAuthDemoActive = () => localStorage.setItem(AUTH_DEMO_KEY, "true");

export const clearAuthDemo = () => localStorage.removeItem(AUTH_DEMO_KEY);

/** Returns true if demo mode is active */
export const isAuthDemoActive = () => localStorage.getItem(AUTH_DEMO_KEY) === "true";

/** Detect if current route is in demo mode (route or search) */
export const shouldEnableAuthDemo = (location: { pathname: string; search: string }) => {
  return (
    location.pathname.startsWith("/auth-demo") ||
    new URLSearchParams(location.search).get("from") === "auth-demo"
  );
};

/** Used to extract ?verified=true or ?reset=success flags from query */
export function getVerifiedFromSearch(search: string) {
  try {
    const params = new URLSearchParams(search);
    return params.get("verified") === "true";
  } catch {
    return false;
  }
}

export function getResetSuccessFromSearch(search: string) {
  try {
    const params = new URLSearchParams(search);
    return params.get("reset") === "success";
  } catch {
    return false;
  }
}
