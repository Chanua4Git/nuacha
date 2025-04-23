
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabaseClient } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthProvider';
import { validatePassword, PasswordPolicy } from '../utils/passwordValidation';
import { SignupForm } from './signup/SignupForm';
import { EmailSentCard } from './signup/EmailSentCard';
import BackToAuthDemo from "./BackToAuthDemo";
import { useAuthDemo } from '../contexts/AuthDemoProvider';
import { AuthDemoService } from '../services/AuthDemoService';

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
  const { setVerificationEmail } = useAuthDemo();

  useEffect(() => {
    if (user && !isAuthDemo) {
      const intendedPath = localStorage.getItem('intendedPath') || '/';
      localStorage.removeItem('intendedPath');
      navigate(intendedPath);
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
      // Use our demo service to get the redirect URL if in demo mode
      const redirectTo = isAuthDemo 
        ? AuthDemoService.getVerificationRedirectUrl()
        : `${window.location.origin}/dashboard`;

      console.log("Signup redirectTo:", redirectTo);

      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        }
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      
      // Store the email for the demo flow if in demo mode
      if (isAuthDemo) {
        setVerificationEmail(email);
      }
      
      toast.success("Verification email sent", {
        description: "Please check your email to verify your account before continuing."
      });
      
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = "We couldn't create your account. Please try again.";
      
      if (error.message.includes("already registered")) {
        errorMessage = "This email is already registered. Try signing in instead.";
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
    return <EmailSentCard email={email} onBack={() => setEmailSent(false)} />;
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
