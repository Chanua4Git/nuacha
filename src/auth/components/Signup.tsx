
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabaseClient } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthProvider';
import { validatePassword, PasswordPolicy } from '../utils/passwordValidation';
import { SignupForm } from './signup/SignupForm';
import { EmailSentCard } from './signup/EmailSentCard';
import BackToAuthDemo from "./BackToAuthDemo";

const PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireNumber: true,
  requireSpecialOrUpper: true
};

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [validations, setValidations] = useState(validatePassword('', PASSWORD_POLICY));
  const location = useLocation();
  const isAuthDemo = location.search.includes('from=auth-demo');

  // When user is logged in, redirect out unless in auth demo
  useEffect(() => {
    if (user && !isAuthDemo) {
      const intendedPath = localStorage.getItem('intendedPath') || '/';
      localStorage.removeItem('intendedPath');
      navigate(intendedPath);
    } else if (user && isAuthDemo) {
      // If user is logged in and in demo, ensure they land in demo, not regular app
      navigate('/auth-demo', { replace: true });
    }
  }, [user, navigate, isAuthDemo]);

  useEffect(() => {
    setValidations(validatePassword(password, PASSWORD_POLICY));
  }, [password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast("Let's fill in all the fields", {
        description: "Both email and password are needed to create your account."
      });
      return;
    }
    
    if (!validations.length || !validations.number || !validations.special) {
      toast("Your password needs to meet all requirements", {
        description: "Please ensure your password meets the requirements below."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Always set redirect and final navigation with correct context
      const demoParam = isAuthDemo ? "?from=auth-demo" : "";
      const emailRedirectTo = isAuthDemo 
        ? `${window.location.origin}/auth-demo?verified=true`
        : `${window.location.origin}/dashboard`;

      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
        }
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast.success("Verification email sent", {
        description: "Please check your email to verify your account before continuing."
      });
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = "We couldn't create your account. Please try again.";
      
      if (error.message.includes("already registered")) {
        errorMessage = "This email is already registered. Try signing in instead.";
        // If they're already registered and came from demo, help them back to login page with param preserved
        if (isAuthDemo) {
          setTimeout(() => {
            navigate("/login?from=auth-demo");
          }, 1200);
        }
      } else if (error.message.includes("valid email")) {
        errorMessage = "Please enter a valid email address.";
      }
      
      toast("Something didn't go as planned", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    // If they go "back" from the EmailSentCard, it brings them back to sign up page, preserving params
    const handleBack = () => {
      setEmailSent(false);
      if (isAuthDemo) {
        // Always preserve context
        navigate("/signup?from=auth-demo");
      }
    };
    return <EmailSentCard email={email} onBack={handleBack} />;
  }

  return (
    <div>
      {isAuthDemo && <BackToAuthDemo />}
      <SignupForm
        email={email}
        password={password}
        isLoading={isLoading}
        validations={validations}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSignup}
        passwordPolicy={PASSWORD_POLICY}
      />
    </div>
  );
};

export default Signup;

