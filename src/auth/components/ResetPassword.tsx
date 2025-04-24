import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { EmailSentCard } from './reset-password/EmailSentCard';
import { RequestResetForm } from './reset-password/RequestResetForm';
import BackToAuthDemo from "./BackToAuthDemo";

const ResetPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // In demo mode if query param is present
  const isAuthDemo = location.search.includes('from=auth-demo');

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email required', {
        description: 'Please enter your email address.',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Always redirect to confirm page first
      const redirectTo = `${window.location.origin}/reset-password/confirm${isAuthDemo ? '?from=auth-demo' : ''}`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Reset link sent', {
        description: 'Please check your email for the password reset link.',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let errorMessage = "We couldn't send the reset link. Please try again.";
      
      if (error.message.includes("Email rate limit exceeded")) {
        errorMessage = "Too many requests. Please wait a few minutes and try again.";
      } else if (error.message.includes("User not found")) {
        errorMessage = "No account found with this email address.";
      }
      
      toast.error('Reset link failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return <EmailSentCard email={email} onBack={() => setEmailSent(false)} />;
  }

  return (
    <div className="container max-w-md mx-auto p-4 mt-8">
      <BackToAuthDemo />
      <RequestResetForm
        email={email}
        isLoading={isLoading}
        onEmailChange={setEmail}
        onSubmit={handleSendResetLink}
      />
    </div>
  );
};

export default ResetPassword;
