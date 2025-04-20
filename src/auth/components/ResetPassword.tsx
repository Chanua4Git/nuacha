
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { EmailSentCard } from './reset-password/EmailSentCard';
import { RequestResetForm } from './reset-password/RequestResetForm';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast("Let's fill in your email", {
        description: 'Please enter the email address associated with your account.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Reset link sent', {
        description: 'Check your email for a link to reset your password.',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let errorMessage = "We couldn't send a reset link. Please try again.";
      
      if (error.message.includes("not found")) {
        errorMessage = "We couldn't find an account with that email address.";
      }
      
      toast("Something didn't go as planned", {
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
    <RequestResetForm
      email={email}
      isLoading={isLoading}
      onEmailChange={setEmail}
      onSubmit={handleSendResetLink}
    />
  );
};

export default ResetPassword;
