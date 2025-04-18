
import { useAuth } from '../contexts/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Welcome to your expense tracker dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>You are logged in as: <strong>{user.email}</strong></p>
          <p>This is a protected page that only authenticated users can access.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
