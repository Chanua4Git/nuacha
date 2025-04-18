
import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabaseClient } from '../utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const isSettingNewPassword = !!token;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (password.length < 8) {
      toast('Password is too short', {
        description: 'For your security, please use at least 8 characters.',
      });
      return;
    }

    if (!/\d/.test(password)) {
      toast('Password needs a number', {
        description: 'Please include at least one number in your password.',
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

      // Short delay before navigating to give user time to see the success message
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      console.error('Update password error:', error);
      
      let errorMessage = "We couldn't update your password. Please try again.";
      
      if (error.message.includes("expired")) {
        errorMessage = "Your reset link has expired. Please request a new one.";
        // Navigate back to reset password request page
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
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
          <CardDescription>We've sent you a password reset link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center py-4">
            Please check your email ({email}) for a link to reset your password.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Don't see the email? Check your spam folder or try again.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            variant="outline" 
            onClick={() => setEmailSent(false)} 
            className="w-full"
          >
            Back
          </Button>
          <div className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">
          {isSettingNewPassword ? 'Create a new password' : 'Reset your password'}
        </CardTitle>
        <CardDescription>
          {isSettingNewPassword
            ? 'Enter a new password for your account'
            : "We'll send you a link to reset your password"}
        </CardDescription>
      </CardHeader>

      <form onSubmit={isSettingNewPassword ? handleUpdatePassword : handleSendResetLink}>
        <CardContent className="space-y-4">
          {isSettingNewPassword ? (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                New Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className={password.length >= 8 ? "text-green-700" : "text-muted-foreground"}>
                    ✓ At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={/\d/.test(password) ? "text-green-700" : "text-muted-foreground"}>
                    ✓ At least one number
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full"
                disabled={isLoading}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSettingNewPassword ? 'Updating...' : 'Sending...'}
              </>
            ) : (
              isSettingNewPassword ? 'Update password' : 'Send reset link'
            )}
          </Button>
          <div className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ResetPassword;
