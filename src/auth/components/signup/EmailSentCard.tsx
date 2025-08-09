
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface EmailSentCardProps {
  email: string;
  onBack: () => void;
}

export const EmailSentCard = ({ email, onBack }: EmailSentCardProps) => {
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
          onClick={onBack} 
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
};
