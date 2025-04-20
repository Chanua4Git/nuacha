
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
      // Get token from URL parameters
      const type = searchParams.get('type');
      
      if (type !== 'recovery') {
        setIsValid(false);
        toast.error('Invalid reset link', {
          description: 'Please request a new password reset link.',
        });
        return;
      }

      // For recovery flow, if we have a valid token, we'll have access to the session
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error || !session) {
        setIsValid(false);
        toast.error('Reset link expired', {
          description: 'Please request a new password reset link.',
        });
        return;
      }

      setIsValid(true);
    };

    validateResetToken();
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error('Password required', {
        description: 'Please enter your new password.',
      });
      return;
    }

    if (!validations.length || !validations.number) {
      toast.error('Invalid password', {
        description: 'Please ensure your password meets all requirements.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabaseClient.auth.updateUser({ password });

      if (error) throw error;

      toast.success('Password updated', {
        description: 'Your password has been reset successfully.',
      });

      // Clear any existing sessions and redirect to login
      await supabaseClient.auth.signOut();
      
      navigate('/login', { 
        replace: true,
        state: { message: 'passwordReset' } 
      });
    } catch (error: any) {
      console.error('Update password error:', error);
      toast.error('Password update failed', {
        description: error.message || 'Please try again or request a new reset link.',
      });
      
      if (error.message.includes('expired')) {
        setTimeout(() => {
          navigate('/reset-password');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isValid === null) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <p className="text-muted-foreground">Verifying reset link...</p>
      </div>
    );
  }

  if (isValid === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertDescription>
            This password reset link is invalid or has expired.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link to="/reset-password">Request New Reset Link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-4 mt-8">
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
    </div>
  );
};

export default ResetPasswordConfirm;
