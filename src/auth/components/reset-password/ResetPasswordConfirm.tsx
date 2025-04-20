
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabaseClient } from '../../utils/supabaseClient';
import { validatePassword } from '../../utils/passwordValidation';
import { UpdatePasswordForm } from './UpdatePasswordForm';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ResetPasswordConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validations, setValidations] = useState(validatePassword(''));

  useEffect(() => {
    const validateResetToken = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (!token || type !== 'recovery') {
        setIsValid(false);
        return;
      }

      try {
        // Use the correct method for validating a recovery token
        // The API expects the token in the URL which Supabase already processed
        // We just need to check if the session is now valid
        const { data, error } = await supabaseClient.auth.getSession();

        if (error || !data.session) {
          setIsValid(false);
          return;
        }
        setIsValid(true);
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValid(false);
      }
    };

    validateResetToken();
  }, [searchParams]);

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

      toast.success('Password updated successfully', {
        description: 'Your password has been reset. You can now sign in with your new password.',
      });

      // Clear any existing sessions
      await supabaseClient.auth.signOut();

      setTimeout(() => {
        navigate('/login?resetSuccess=true');
      }, 1500);
    } catch (error: any) {
      console.error('Update password error:', error);
      
      let errorMessage = "We couldn't update your password. Please try again.";
      
      if (error.message.includes("expired")) {
        errorMessage = "Your reset link has expired. Please request a new one.";
        setTimeout(() => {
          navigate('/reset-password');
        }, 1500);
      }
      
      toast("Something didn't go as planned", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValid === null) {
    return <div className="flex justify-center items-center min-h-screen">
      Verifying reset link...
    </div>;
  }

  if (isValid === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertDescription>
            Your password reset link is invalid or has expired.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/reset-password">Request New Reset Link</Link>
        </Button>
      </div>
    );
  }

  return (
    <UpdatePasswordForm
      password={password}
      isLoading={isLoading}
      validations={validations}
      onPasswordChange={(newPassword) => {
        setPassword(newPassword);
        setValidations(validatePassword(newPassword));
      }}
      onSubmit={handleUpdatePassword}
    />
  );
};

export default ResetPasswordConfirm;
