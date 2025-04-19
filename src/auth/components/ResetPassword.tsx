
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabaseClient } from '../utils/supabaseClient';
import { toast } from 'sonner';
import { validatePassword } from '../utils/passwordValidation';
import { EmailSentCard } from './reset-password/EmailSentCard';
import { RequestResetForm } from './reset-password/RequestResetForm';
import { UpdatePasswordForm } from './reset-password/UpdatePasswordForm';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const isSettingNewPassword = !!token;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [validations, setValidations] = useState(validatePassword(''));

  useEffect(() => {
    if (isSettingNewPassword) {
      setValidations(validatePassword(password));
    }
  }, [password, isSettingNewPassword]);

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
        redirectTo: `${window.location.origin}/reset-password`,
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast('Please enter a new password', {
        description: 'Your new password should be at least 8 characters long.',
      });
      return;
    }

    if (!validations.length || !validations.number) {
      toast('Password requirements not met', {
        description: 'Please make sure your password meets all the requirements.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabaseClient.auth.updateUser({ password });

      if (error) throw error;

      toast.success('Password updated', {
        description: 'Your password has been updated successfully.',
      });

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      console.error('Update password error:', error);
      
      let errorMessage = "We couldn't update your password. Please try again.";
      
      if (error.message.includes("expired")) {
        errorMessage = "Your reset link has expired. Please request a new one.";
        navigate('/reset-password');
      }
      
      toast("Something didn't go as planned", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent && !isSettingNewPassword) {
    return <EmailSentCard email={email} onBack={() => setEmailSent(false)} />;
  }

  if (isSettingNewPassword) {
    return (
      <UpdatePasswordForm
        password={password}
        isLoading={isLoading}
        validations={validations}
        onPasswordChange={setPassword}
        onSubmit={handleUpdatePassword}
      />
    );
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
