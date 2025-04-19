import { useAuth } from '../contexts/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, isLoading } = useAuth();

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
      </Card>
    </div>
  );
};

export default Dashboard;
