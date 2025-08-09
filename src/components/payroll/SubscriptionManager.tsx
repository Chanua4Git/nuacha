import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { usePayPalSubscription } from '@/hooks/usePayPalSubscription';
import { Crown, Star, Check, X } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  max_employees: number;
  features: any;
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  paypal_subscription_id: string;
  subscription_plans: SubscriptionPlan;
}

export const SubscriptionManager = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { createSubscription, cancelSubscription, isLoading } = usePayPalSubscription();

  useEffect(() => {
    if (user) {
      fetchPlansAndSubscription();
    }
  }, [user]);

  const fetchPlansAndSubscription = async () => {
    try {
      // Fetch available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (plansError) {
        console.error('Error fetching plans:', plansError);
      } else {
        setPlans(plansData || []);
      }

      // Fetch current subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', subscriptionError);
      } else {
        setCurrentSubscription(subscriptionData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const subscriptionData = await createSubscription(planId);
      
      if (subscriptionData?.approvalUrl) {
        // Redirect to PayPal for subscription approval
        window.location.href = subscriptionData.approvalUrl;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription?.paypal_subscription_id) return;

    const success = await cancelSubscription(currentSubscription.paypal_subscription_id);
    if (success) {
      fetchPlansAndSubscription();
    }
  };

  const getFeatureIcon = (feature: string) => {
    const featureIcons: Record<string, React.ReactNode> = {
      'advanced_reporting': <Star className="h-4 w-4" />,
      'export_features': <Check className="h-4 w-4" />,
      'priority_support': <Crown className="h-4 w-4" />,
    };
    return featureIcons[feature] || <Check className="h-4 w-4" />;
  };

  const getFeatureLabel = (feature: string) => {
    const featureLabels: Record<string, string> = {
      'advanced_reporting': 'Advanced Reporting',
      'export_features': 'Data Export',
      'priority_support': 'Priority Support',
      'unlimited_employees': 'Unlimited Employees',
    };
    return featureLabels[feature] || feature;
  };

  if (loading) {
    return <div>Loading subscription information...</div>;
  }

  return (
    <div className="space-y-6">
      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{currentSubscription.subscription_plans.name}</h3>
                <p className="text-muted-foreground">
                  ${currentSubscription.subscription_plans.price}/{currentSubscription.subscription_plans.billing_cycle}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {currentSubscription.status}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                onClick={handleCancelSubscription}
                disabled={isLoading}
              >
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription?.subscription_plans?.id === plan.id;
          
          return (
            <Card key={plan.id} className={isCurrentPlan ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrentPlan && <Badge>Current</Badge>}
                </CardTitle>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    ${plan.price}
                    <span className="text-base font-normal text-muted-foreground">
                      /{plan.billing_cycle}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Up to {plan.max_employees} employees</p>
                </div>
                
                <div className="space-y-2">
                  {(Array.isArray(plan.features) ? plan.features : []).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {getFeatureIcon(feature)}
                      <span className="text-sm">{getFeatureLabel(feature)}</span>
                    </div>
                  ))}
                </div>

                {!isCurrentPlan && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                  >
                    Subscribe to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};