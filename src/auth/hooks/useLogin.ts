
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
        let errorMessage = "We couldn't sign you in. Please try again.";

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Your email or password seems incorrect. Please try again.";
        } else if (error.message.includes("Email not confirmed")) {
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
        toast.success("Welcome back");
      }

      // Auth demo: always redirect to /auth-demo if demo is active
      if (getAuthDemoActive()) {
        navigate('/auth-demo', { replace: true });
        return;
      }

      // Normal user redirect
      const intendedPath = localStorage.getItem("intendedPath") || "/";
      localStorage.removeItem("intendedPath");
      navigate(intendedPath);

    } catch (err: any) {
      toast.error("An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}
