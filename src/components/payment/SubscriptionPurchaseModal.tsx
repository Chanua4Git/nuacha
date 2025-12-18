import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, MessageCircle, Building2, HardDrive } from 'lucide-react';
import { useSubscriptionPurchase } from '@/hooks/useSubscriptionPurchase';
import { 
  NUACHA_BANK_DETAILS, 
  PlanType, 
  BillingCycle, 
  getPlanPriceTTD,
  getPlanPriceUSD,
  formatTTD,
  formatUSD,
  getPlan,
  formatStorageSize
} from '@/constants/nuachaPayment';
import { generatePaymentScreenshotMessage, generateNuachaWhatsAppUrl } from '@/utils/whatsapp';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: PlanType;
}

export function SubscriptionPurchaseModal({ open, onOpenChange, planType }: SubscriptionPurchaseModalProps) {
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { isLoading, order, createOrder } = useSubscriptionPurchase();
  const { toast } = useToast();
  
  const plan = getPlan(planType);
  const priceTTD = getPlanPriceTTD(planType, billingCycle);
  const priceUSD = getPlanPriceUSD(planType, billingCycle);

  // Calculate yearly savings
  const yearlySavings = billingCycle === 'yearly' 
    ? Math.round(((plan.monthlyPriceTTD * 12) - plan.yearlyPriceTTD))
    : 0;

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !customerEmail.trim()) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const result = await createOrder({
      customerName,
      customerEmail,
      customerPhone,
      planType,
      billingCycle
    });
    
    if (result) {
      setStep('payment');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleWhatsAppClick = () => {
    if (!order) return;
    
    const message = generatePaymentScreenshotMessage(
      order.order_reference,
      customerName,
      plan.name,
      priceTTD,
      priceUSD
    );
    
    const url = generateNuachaWhatsAppUrl(message);
    window.open(url, '_blank');
  };

  const resetModal = () => {
    setStep('details');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setBillingCycle('monthly');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {step === 'details' ? `Get ${plan.name}` : 'Complete Your Payment'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' 
              ? 'Enter your details to start your subscription' 
              : 'Transfer the amount and send us the screenshot'}
          </DialogDescription>
        </DialogHeader>

        {step === 'details' ? (
          <form onSubmit={handleSubmitDetails} className="space-y-6">
            {/* Billing Cycle Selection */}
            <div className="space-y-3">
              <Label>Billing Cycle</Label>
              <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly" className="relative">
                    Yearly
                    <Badge variant="secondary" className="ml-1 text-xs bg-soft-green text-primary">
                      Save 17%
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Price Display - TTD Primary */}
              <div className="text-center py-4 bg-muted/30 rounded-lg">
                <span className="text-4xl font-bold text-primary">{formatTTD(priceTTD)}</span>
                <span className="text-muted-foreground">
                  {billingCycle === 'monthly' ? '/month' : '/year'}
                </span>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatUSD(priceUSD)}
                </div>
                {yearlySavings > 0 && (
                  <div className="text-sm text-primary mt-2">
                    You save {formatTTD(yearlySavings)} per year!
                  </div>
                )}
              </div>
            </div>

            {/* Storage & Features */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                {/* Storage highlight */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <span className="font-medium">{formatStorageSize(plan.storageMB)} secure storage</span>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp Number (for confirmation)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 868 123 4567"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Creating Order...' : 'Continue to Payment'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Order Reference */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Your Order Reference</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-mono font-bold tracking-wider">
                      {order?.order_reference}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(order?.order_reference || '')}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-lg font-semibold text-foreground">
                      {formatTTD(priceTTD)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatUSD(priceUSD)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Bank Transfer Details</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-medium">{NUACHA_BANK_DETAILS.bankName}</span>
                  
                  <span className="text-muted-foreground">Branch:</span>
                  <span className="font-medium">{NUACHA_BANK_DETAILS.branch}</span>
                  
                  <span className="text-muted-foreground">Account #:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium font-mono">{NUACHA_BANK_DETAILS.accountNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(NUACHA_BANK_DETAILS.accountNumber)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{NUACHA_BANK_DETAILS.accountHolder}</span>
                  
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{NUACHA_BANK_DETAILS.accountType}</span>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <div className="text-sm text-muted-foreground text-center space-y-2">
              <p>After completing your transfer, send us a screenshot via WhatsApp.</p>
              <p className="text-xs">Include your order reference: <strong>{order?.order_reference}</strong></p>
            </div>

            {/* WhatsApp Button */}
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleWhatsAppClick}
            >
              <MessageCircle className="h-5 w-5" />
              Send Payment Screenshot via WhatsApp
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              We'll confirm your payment and activate your account within 24 hours.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
