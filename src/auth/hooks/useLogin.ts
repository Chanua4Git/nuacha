
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "../utils/supabaseClient";
import { toast } from "sonner";

// Helper for "from=auth-demo" detection
function getAuthDemoActive() {
  try {
    return localStorage.getItem('authDemoActive') === 'true';
  } catch {
    return false;
  }
}

// Helper to clear auth demo mode
function clearAuthDemoMode() {
  try {
    localStorage.removeItem('authDemoActive');
  } catch {
    // Ignore localStorage errors
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      toast("Let's fill in all the fields", {
        description: "Both email and password are needed to sign in."
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          // Check whether this email has an account at all — if not, guide to Sign up
          let registered = true;
          try {
            const { data: exists } = await supabaseClient.rpc("email_registered", { _email: email });
            registered = !!exists;
          } catch {
            // If the check fails, fall back to the generic message
          }

          if (!registered) {
            toast("We don't know this email yet", {
              description: "There's no account with this email. Let's get you set up — it only takes a moment.",
              action: {
                label: "Sign up",
                onClick: () => navigate("/signup", { state: { email } }),
              },
              duration: 10000,
            });
          } else {
            toast("That password doesn't match", {
              description: "This email has an account, but the password isn't right. Try again, use Google or Facebook if that's how you joined, or tap Forgot password.",
              duration: 8000,
            });
          }
          return;
        }

        let errorMessage = "We couldn't sign you in. Please try again.";
        if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email and verify your account first.";
        }

        toast("Something didn't go as planned", {
          description: errorMessage,
        });
        return;
      }

      // Additional check: unconfirmed email
      if (data?.user && !data.user.email_confirmed_at) {
        toast("Please verify your email", {
          description: "Check your inbox for a verification link."
        });
      } else {
        // Clear auth demo mode on successful login
        clearAuthDemoMode();
        
        // Only check for auth demo mode if we're already in it
        if (getAuthDemoActive()) {
          navigate('/authentication-demo', { replace: true });
          return;
        }

        // Redirect logic is handled by AuthProvider to avoid race conditions
        // The AuthProvider will handle the intended path redirect
      }

    } catch (err: any) {
      toast.error("An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}
