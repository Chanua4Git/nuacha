
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabaseClient } from '../utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthProvider';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Password validation states
  const [validations, setValidations] = useState({
    length: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    if (user) {
      const intendedPath = localStorage.getItem('intendedPath') || '/';
      localStorage.removeItem('intendedPath');
      navigate(intendedPath);
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check password requirements on password change
    setValidations({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password) || /[A-Z]/.test(password),
    });
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
      
      // Improved error UX with user-friendly messages
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
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
          <CardDescription>We've sent you a verification link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center py-4">
            Please check your email ({email}) to verify your account before continuing.
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
            Back to sign up
          </Button>
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            
            {/* Password strength indicators */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-2 text-xs">
                {validations.length ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <XCircle className="h-4 w-4 text-red-500" />}
                <span className={validations.length ? "text-green-700" : "text-muted-foreground"}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {validations.number ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <XCircle className="h-4 w-4 text-red-500" />}
                <span className={validations.number ? "text-green-700" : "text-muted-foreground"}>
                  At least one number
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {validations.special ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <XCircle className="h-4 w-4 text-gray-400" />}
                <span className={validations.special ? "text-green-700" : "text-muted-foreground"}>
                  At least one symbol or uppercase letter (optional)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Sign up'
            )}
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
