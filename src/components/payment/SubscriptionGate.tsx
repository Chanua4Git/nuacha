import { useActiveSubscription, hasFeatureAccess } from '@/hooks/useActiveSubscription';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { Loader2 } from 'lucide-react';
import FeatureUpsellPage from './FeatureUpsellPage';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature: 'budget' | 'payroll' | 'unlimited_scans';
  requiredPlan?: 'families' | 'business' | 'entrepreneurs';
}

const SubscriptionGate = ({ children, feature, requiredPlan }: SubscriptionGateProps) => {
  const { user, isLoading: authLoading } = useAuth();
  const { hasActiveSubscription, planType, isLoading: subLoading } = useActiveSubscription();

  // Show loading state while checking auth and subscription
  if (authLoading || subLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking your subscription...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, ProtectedRoute should handle this
  // But just in case, show upsell
  if (!user) {
    return <FeatureUpsellPage feature={feature} requiredPlan={requiredPlan || 'families'} />;
  }

  // Check if user has active subscription with access to this feature
  const hasAccess = hasActiveSubscription && hasFeatureAccess(planType, feature);

  if (!hasAccess) {
    return <FeatureUpsellPage feature={feature} requiredPlan={requiredPlan || 'families'} />;
  }

  // User has access - render children
  return <>{children}</>;
};

export default SubscriptionGate;
