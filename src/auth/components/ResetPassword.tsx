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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isSettingNewPassword = !!token;

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast('We need your email address', {
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

      toast.success('Reset link sent', {
        description: 'Check your email for a link to reset your password.',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast("Something didn't go as planned", {
        description: error.message || "We couldn't send a reset link. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast('Please enter a new password', {
        description: 'Your new password should be at least 6 characters long.',
      });
      return;
    }

    if (password.length < 6) {
      toast('Your password needs to be a bit longer', {
        description: 'For your security, please use at least 6 characters.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast.success('Password updated', {
        description: 'Your password has been updated successfully.',
      });

      navigate('/login');
    } catch (error: any) {
      console.error('Update password error:', error);
      toast("Something didn't go as planned", {
        description: error.message || "We couldn't update your password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              <label htmlFor="password" className="text-sm font-medium">New Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? (isSettingNewPassword ? 'Updating...' : 'Sending...')
              : (isSettingNewPassword ? 'Update password' : 'Send reset link')}
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
