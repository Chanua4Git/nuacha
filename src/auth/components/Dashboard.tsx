
import { useAuth } from '../contexts/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, ArrowRight, CheckCircle2, Clock, Sparkles, PlusCircle, BarChart3, Calculator, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useUserProgress } from '@/hooks/useUserProgress';

const Dashboard = () => {
  const { user, isLoading, authDemoActive } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const progress = useUserProgress();
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
                onClick={() => window.location.href = "/authentication-demo"}
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
              
              {/* Progress Overview */}
              {!progress.loading && progress.totalTasks > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary">Your Setup Progress</p>
                    <p className="text-sm text-muted-foreground">
                      {progress.completed.length} / {progress.totalTasks} complete
                    </p>
                  </div>
                  <Progress 
                    value={(progress.completed.length / progress.totalTasks) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Completed Tasks */}
              {progress.completed.length > 0 && (
                <div className="p-4 rounded-lg bg-soft-green/10 border border-soft-green">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-primary">What You've Accomplished</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Great progress! You've completed {progress.completed.length} key milestone{progress.completed.length > 1 ? 's' : ''}.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {progress.completed.map((task) => (
                      <Button
                        key={task.id}
                        variant="ghost"
                        className="justify-start h-auto py-3 px-3 hover:bg-soft-green/20 text-left"
                        onClick={() => navigate(task.link)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <task.icon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.count ? `${task.count} added` : 'Completed'}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Tasks */}
              {progress.inProgress.length > 0 && (
                <div className="p-4 rounded-lg bg-accent/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-medium text-primary">Keep Going</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    You've started these - let's build the habit!
                  </p>
                  <div className="space-y-2">
                    {progress.inProgress.map((task) => (
                      <Button
                        key={task.id}
                        variant="outline"
                        className="w-full justify-between h-auto py-3"
                        onClick={() => navigate(task.link)}
                      >
                        <div className="flex items-start gap-3 text-left">
                          <task.icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="p-4 rounded-lg bg-background border border-blush/30">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-blush" />
                  <h3 className="font-medium text-primary">Suggested Next Steps</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Ready when you are - no pressure
                </p>
                {progress.nextSteps.length > 0 ? (
                  <div className="space-y-2">
                    {progress.nextSteps.map((task) => (
                      <Button
                        key={task.id}
                        variant="ghost"
                        className="w-full justify-between h-auto py-3 hover:bg-blush/10"
                        onClick={() => navigate(task.link)}
                      >
                        <div className="flex items-start gap-3 text-left">
                          <task.icon className="h-4 w-4 text-primary/70 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0" />
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">You're all caught up!</p>
                    <p className="text-sm">Explore features at your own pace.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="p-4 rounded-lg bg-background border border-border">
                <h3 className="font-medium text-primary mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Add Expense', link: '/app?tab=add-expense', icon: PlusCircle },
                    { label: 'View Reports', link: '/reports', icon: BarChart3 },
                    { label: 'Manage Budget', link: '/budget', icon: Calculator },
                    { label: 'Settings', link: '/options', icon: Settings }
                  ].map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="flex-col h-auto py-3 px-2"
                      onClick={() => navigate(action.link)}
                    >
                      <action.icon className="h-5 w-5 mb-1" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  ))}
                </div>
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
