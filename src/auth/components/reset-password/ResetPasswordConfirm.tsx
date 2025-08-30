import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from '../../utils/passwordValidation';
import { UpdatePasswordForm } from './UpdatePasswordForm';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import BackToAuthDemo from "../BackToAuthDemo";
import { useAuthDemo } from '@/auth/contexts/AuthDemoProvider';
import { AuthDemoStep } from '@/auth/services/AuthDemoService';

const ResetPasswordConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validations, setValidations] = useState(validatePassword(''));
  const { setDemoStep } = useAuthDemo();
  const isAuthDemo = location.search.includes('from=auth-demo');

  useEffect(() => {
    const validateResetToken = async () => {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (!accessToken || type !== 'recovery') {
        setIsValid(false);
        toast.error('Invalid reset link', {
          description: 'Please request a new password reset link.',
        });
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (error) {
          throw error;
        }

        if (!session) {
          throw new Error('No session established');
        }

        setIsValid(true);
      } catch (error: any) {
        setIsValid(false);
        toast.error('Reset link expired', {
          description: 'Please request a new password reset link.',
        });
      }
    };

    validateResetToken();
  }, [location]);

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
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      if (isAuthDemo) {
        setDemoStep(AuthDemoStep.Completed);
        toast.success('Demo completed!', {
          description: "Let's explore which Nuacha solution fits your needs.",
        });
        
        await supabase.auth.signOut();
        navigate('/authentication-demo', { replace: true });
      } else {
        toast.success('Password updated successfully');
        await supabase.auth.signOut();
        navigate('/login', { 
          replace: true,
          state: { message: 'passwordReset' } 
        });
      }
    } catch (error: any) {
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
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
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
      <BackToAuthDemo />
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
