
import { useAuth } from '../contexts/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, isLoading, authDemoActive } = useAuth();
  const location = useLocation();
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [isJustVerified, setIsJustVerified] = useState(false);

  // Check if the user has just verified their email
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const verified = searchParams.get("verified") === "true";
    
    if (verified && user) {
      setIsJustVerified(true);
      setWelcomeModalOpen(true);
      
      // Clean URL by removing the verified parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("verified");
      window.history.replaceState({}, document.title, url.pathname);
      
      // Show a success toast
      toast.success("Email successfully verified!", {
        description: "Your account is now active"
      });
    }
  }, [location.search, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {authDemoActive && (
          <div className="mb-6 p-4 bg-soft-green/20 border border-soft-green rounded-lg">
            <h2 className="text-lg font-medium mb-2 text-primary">Demo Mode Active</h2>
            <p className="text-muted-foreground mb-4">
              You're currently experiencing Nuacha in demo mode. 
              {isJustVerified && " You've completed step 1 of the authentication process!"}
            </p>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="border-soft-green text-primary hover:bg-soft-green/20"
                onClick={() => window.location.href = "/auth-demo"}
              >
                Return to Demo Guide
              </Button>
            </div>
          </div>
        )}
      
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-2xl font-playfair">Welcome to Nuacha</CardTitle>
            <CardDescription>Your mindful financial companion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-soft-green/10 border border-soft-green">
                <h3 className="font-medium text-primary mb-2">Your Account</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  You are logged in as: <strong>{user.email}</strong>
                </p>
                {user.email_confirmed_at ? (
                  <div className="mt-2 text-sm text-green-600 bg-soft-green/20 px-3 py-1 rounded-full inline-flex items-center">
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                    Email verified
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-amber-600 bg-accent/50 px-3 py-1 rounded-full inline-flex items-center">
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                      />
                    </svg>
                    Email not verified - check your inbox
                  </div>
                )}
              </div>
              
              <div className="p-4 rounded-lg bg-soft-gray border border-gray-200">
                <h3 className="font-medium text-primary mb-2">Next Steps</h3>
                <ul className="space-y-3 text-sm md:text-base">
                  {[
                    "Create a family to start tracking expenses",
                    "Add your first expense",
                    "Set up reminders for recurring expenses"
                  ].map((step, index) => (
                    <li key={index} className="flex items-start">
                      <svg 
                        className="w-5 h-5 text-primary mr-2 mt-0.5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
          {authDemoActive && (
            <CardFooter>
              <div className="w-full">
                <h3 className="font-medium text-primary mb-2">Authentication Demo Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => window.location.href = "/login"}
                  >
                    <span>Try Logging In Again</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => window.location.href = "/reset-password"}
                  >
                    <span>Try Password Reset</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Welcome modal for newly verified users */}
      <Dialog open={welcomeModalOpen} onOpenChange={setWelcomeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Welcome to Nuacha!
            </DialogTitle>
            <DialogDescription>
              Your email has been verified and your account is now fully active.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {authDemoActive ? (
              <div className="space-y-4">
                <h3 className="font-medium">Authentication Demo Progress</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white">1</div>
                    <div className="flex-1">
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3 w-[1px] h-4 bg-gray-300 mx-auto"></div>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white">2</div>
                    <div className="flex-1">
                      <p className="font-medium">Try Login Flow</p>
                      <p className="text-sm text-muted-foreground">Try signing out and in again</p>
                    </div>
                  </div>
                  <div className="ml-3 w-[1px] h-4 bg-gray-300 mx-auto"></div>
                  <div className="flex items-center gap-3 opacity-70">
                    <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-white">3</div>
                    <div className="flex-1">
                      <p className="font-medium">Try Password Reset</p>
                      <p className="text-sm text-muted-foreground">Experience the reset process</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>You're now ready to start using Nuacha to track your expenses.</p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setWelcomeModalOpen(false)}>
              Get Started
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Dashboard;
