
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthProvider';
import { validatePassword } from '../utils/passwordValidation';
import { SignupForm } from './signup/SignupForm';
import { EmailSentCard } from './signup/EmailSentCard';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [validations, setValidations] = useState(validatePassword(''));

  useEffect(() => {
    if (user) {
      const intendedPath = localStorage.getItem('intendedPath') || '/';
      localStorage.removeItem('intendedPath');
      navigate(intendedPath);
    }
  }, [user, navigate]);

  useEffect(() => {
    setValidations(validatePassword(password));
  }, [password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast("Let's fill in all the fields", {
        description: "Both email and password are needed to create your account."
      });
      return;
    }
    
    if (!validations.length || !validations.number) {
      toast("Your password needs to meet all requirements", {
        description: "Please make sure your password is at least 8 characters long and contains at least one number."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
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
    <SignupForm
      email={email}
      password={password}
      isLoading={isLoading}
      validations={validations}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSignup}
    />
  );
};

export default Signup;
