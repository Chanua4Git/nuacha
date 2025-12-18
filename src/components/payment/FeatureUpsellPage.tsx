import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  PiggyBank, 
  Receipt, 
  ArrowRight, 
  Check,
  Sparkles,
  HardDrive
} from 'lucide-react';

interface FeatureUpsellPageProps {
  feature: 'budget' | 'payroll' | 'unlimited_scans';
  requiredPlan: 'staying_organized' | 'fully_streamlined';
}

const FEATURE_CONFIG = {
  budget: {
    title: 'Budget Builder & Planning Tools',
    description: 'Take control of your household finances with our comprehensive budget builder, 50/30/20 rule tracking, and scenario planning.',
    icon: PiggyBank,
    benefits: [
      'Create custom budget templates for each family',
      'Track spending against 50/30/20 rule automatically',
      'Visualize spending patterns with charts',
      'Monthly bill tracker with payment reminders',
      'Scenario planning for financial decisions',
    ],
    color: 'bg-soft-green',
  },
  payroll: {
    title: 'T&T Payroll Calculator',
    description: 'Simplify payroll for your domestic staff or small business with NIS contribution calculations built for Trinidad & Tobago.',
    icon: Calculator,
    benefits: [
      'Automatic NIS contribution calculations',
      'Support for multiple shift types per employee',
      'Quick pay entry with auto-expense creation',
      'Payroll period management and reports',
      'Trinidad & Tobago compliant calculations',
    ],
    color: 'bg-blush',
  },
  unlimited_scans: {
    title: 'Unlimited Receipt Scanning',
    description: 'Scan as many receipts as you need with our AI-powered OCR that extracts line items, dates, and vendors automatically.',
    icon: Receipt,
    benefits: [
      'Unlimited daily receipt scans',
      'AI-powered line item extraction',
      'Smart category suggestions',
      'Multi-page receipt support',
      'Automatic expense creation',
    ],
    color: 'bg-accent',
  },
};

const PLAN_CONFIG = {
  staying_organized: {
    name: 'Staying Organized',
    priceTTD: 'TT$149',
    priceUSD: '~US$21.91',
    storage: '10GB',
    period: 'month',
    route: '/get-started/families',
    features: ['10GB storage', 'Unlimited receipt scanning', 'Multi-family tracking', 'Budget builder', 'Smart categories'],
  },
  fully_streamlined: {
    name: 'Fully Streamlined',
    priceTTD: 'TT$349',
    priceUSD: '~US$51.32',
    storage: '25GB',
    period: 'month',
    route: '/get-started/business',
    features: ['25GB storage', 'Everything in Staying Organized', 'T&T Payroll calculator', 'NIS calculations', 'Employee management'],
  },
};

const FeatureUpsellPage = ({ feature, requiredPlan }: FeatureUpsellPageProps) => {
  const navigate = useNavigate();
  const featureInfo = FEATURE_CONFIG[feature];
  const planInfo = PLAN_CONFIG[requiredPlan];
  const FeatureIcon = featureInfo.icon;

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-background to-accent/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${featureInfo.color} mb-6`}>
            <FeatureIcon className="w-10 h-10 text-primary" />
          </div>
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium Feature
          </Badge>
          <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4">
            {featureInfo.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {featureInfo.description}
          </p>
        </div>

        {/* Benefits */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">What you'll get</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {featureInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-soft-green flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Plan Card */}
        <Card className="border-2 border-primary bg-card">
          <CardHeader className="text-center pb-4">
            <Badge className="w-fit mx-auto mb-2 bg-primary text-primary-foreground">
              Recommended Plan
            </Badge>
            <CardTitle className="text-2xl font-serif">{planInfo.name}</CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold text-foreground">{planInfo.priceTTD}</span>
              <span className="text-muted-foreground">/{planInfo.period}</span>
              <div className="text-sm text-muted-foreground mt-1">
                {planInfo.priceUSD}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Storage highlight */}
            <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-border">
              <HardDrive className="h-5 w-5 text-primary" />
              <span className="font-medium">{planInfo.storage} secure storage</span>
            </div>
            
            <ul className="space-y-2 mb-6">
              {planInfo.features.map((feat, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="flex-1"
                onClick={() => navigate(planInfo.route)}
              >
                Upgrade to {planInfo.name}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/get-started')}
              >
                View All Plans
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="text-center mt-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            ← Go back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeatureUpsellPage;
