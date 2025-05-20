
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
        setLoading(false);
        return;
      }

      // Additional check: unconfirmed email
      if (data?.user && !data.user.email_confirmed_at) {
        toast("Please verify your email", {
          description: "Check your inbox for a verification link."
        });
        setLoading(false);
        return;
      }

      // Get the intended path or default to /app
      const intendedPath = localStorage.getItem("intendedPath") || "/app";
      localStorage.removeItem("intendedPath");

      // If the user is in demo mode, prioritize actual app usage unless 
      // they're explicitly interacting with the demo
      const urlParams = new URLSearchParams(window.location.search);
      const isExplicitlyDemo = urlParams.get("from") === "auth-demo";
      
      setLoading(false);
      
      if (isExplicitlyDemo && getAuthDemoActive()) {
        navigate('/auth-demo', { replace: true });
      } else {
        // For normal usage or if they're not explicitly in demo
        navigate(intendedPath);
      }

    } catch (err: any) {
      toast.error("An unknown error occurred.");
      setLoading(false);
    }
  };

  return { login, loading };
}
