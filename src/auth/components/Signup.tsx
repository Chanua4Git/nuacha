import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabaseClient } from '../utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthProvider';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const intendedPath = localStorage.getItem('intendedPath') || '/';
      localStorage.removeItem('intendedPath');
      navigate(intendedPath);
    }
  }, [user, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast("Let's fill in all the fields", {
        description: "Both email and password are needed to create your account."
      });
      return;
    }
    
    if (password.length < 6) {
      toast("Your password needs to be a bit longer", {
        description: "For your security, please use at least 6 characters."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Account created", {
        description: "Welcome to Nuacha. Your account has been created successfully."
      });
      
      // Keep user on signup page until email is verified
      // They will be redirected once verified through the auth state change
    } catch (error: any) {
      console.error('Signup error:', error);
      toast("Something didn't go as planned", {
        description: error.message || "We couldn't create your account. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Create an account</CardTitle>
        <CardDescription>Sign up to start managing your expenses</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
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
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
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
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Sign up'}
          </Button>
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default Signup;
