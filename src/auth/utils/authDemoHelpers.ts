
export const AUTH_DEMO_KEY = "authDemoActive";
export const AUTH_DEMO_STEP_KEY = "authDemo_step";

/** Set demo mode to active in localStorage */
export const setAuthDemoActive = () => localStorage.setItem(AUTH_DEMO_KEY, "true");
export const clearAuthDemo = () => {
  localStorage.removeItem(AUTH_DEMO_KEY);
  localStorage.removeItem(AUTH_DEMO_STEP_KEY);
};

/** Returns true if demo mode is active */
export const isAuthDemoActive = () => localStorage.getItem(AUTH_DEMO_KEY) === "true";

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

/** Demo step progress helpers */
export function getDemoProgress(): number {
  const raw = localStorage.getItem(AUTH_DEMO_STEP_KEY);
  let step = parseInt(raw ?? "0", 10);
  if (isNaN(step) || step < 0) step = 0;
  if (step > 3) step = 3;
  return step;
}
export function setDemoProgress(step: number) {
  localStorage.setItem(AUTH_DEMO_STEP_KEY, String(step));
}
