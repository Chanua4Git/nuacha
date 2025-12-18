import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Copy, 
  Check, 
  MessageCircle, 
  Building2,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { NUACHA_BANK_DETAILS, formatTTD, formatUSD, getPlan, NUACHA_WHATSAPP_NUMBER } from '@/constants/nuachaPayment';
import { generatePaymentScreenshotMessage, generateNuachaWhatsAppUrl } from '@/utils/whatsapp';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PendingPaymentBannerProps {
  orderReference: string;
  planType: string;
  amountTTD: number;
  amountUSD?: number;
  customerName: string;
}

export function PendingPaymentBanner({
  orderReference,
  planType,
  amountTTD,
  amountUSD,
  customerName
}: PendingPaymentBannerProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const plan = getPlan(planType as any);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const handleWhatsAppClick = () => {
    const message = generatePaymentScreenshotMessage(
      orderReference,
      customerName,
      plan?.name || planType,
      amountTTD,
      amountUSD
    );
    
    const url = generateNuachaWhatsAppUrl(message);
    window.open(url, '_blank');
  };

  const formatWhatsAppNumber = (num: string) => {
    // Format: 868-786-5357
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('1')) {
      return `${cleaned.slice(1, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return num;
  };

  return (
    <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/10 mb-6">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <AlertCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-primary font-serif">
              Complete Your Payment to Activate
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              You're almost there! Make a bank transfer and send us the receipt.
            </p>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            Pending
          </Badge>
        </div>

        {/* Order Details */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Order Info */}
          <div className="p-4 rounded-lg bg-background border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Order Reference</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold tracking-wider text-primary">
                {orderReference}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => copyToClipboard(orderReference)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">Amount to pay:</p>
              <p className="text-2xl font-bold text-primary">{formatTTD(amountTTD)}</p>
              {amountUSD && (
                <p className="text-sm text-muted-foreground">{formatUSD(amountUSD)}</p>
              )}
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-4 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Bank Transfer Details</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-medium">{NUACHA_BANK_DETAILS.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account #:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold">{NUACHA_BANK_DETAILS.accountNumber}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(NUACHA_BANK_DETAILS.accountNumber)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{NUACHA_BANK_DETAILS.accountHolder}</span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <Button 
          className="w-full gap-2 mb-4" 
          size="lg"
          onClick={handleWhatsAppClick}
        >
          <MessageCircle className="h-5 w-5" />
          Send Payment Receipt via WhatsApp
        </Button>

        <p className="text-center text-sm text-muted-foreground mb-6">
          Send your payment screenshot to WhatsApp: <strong>{formatWhatsAppNumber(NUACHA_WHATSAPP_NUMBER)}</strong>
        </p>

        {/* Next Steps */}
        <div className="p-4 rounded-lg bg-soft-green/10 border border-soft-green/30">
          <h3 className="font-medium text-primary mb-3 flex items-center gap-2">
            <span className="text-lg">📋</span> Next Steps
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Make bank transfer</p>
                <p className="text-xs text-muted-foreground">Transfer {formatTTD(amountTTD)} to account {NUACHA_BANK_DETAILS.accountNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Send screenshot via WhatsApp</p>
                <p className="text-xs text-muted-foreground">Include your order reference: {orderReference}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Complete your training</p>
                <p className="text-xs text-muted-foreground mb-2">Learn how to get the most from Nuacha</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigate('/updates')}
                >
                  <BookOpen className="h-4 w-4" />
                  Start Training
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          We'll confirm your payment and activate your account within 24 hours.
        </p>
      </CardContent>
    </Card>
  );
}
