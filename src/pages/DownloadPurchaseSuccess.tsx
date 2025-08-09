import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Download, FileText, Shield, Clock, ExternalLink } from "lucide-react";
import { useDownloadPurchase } from "@/hooks/useDownloadPurchase";
import { supabase } from "@/integrations/supabase/client";

export default function DownloadPurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const [purchase, setPurchase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { capturePayPalPurchase } = useDownloadPurchase();

  useEffect(() => {
    const handlePayPalReturn = async () => {
      const token = searchParams.get('token');
      const PayerID = searchParams.get('PayerID');
      
      if (token && PayerID) {
        // Capture PayPal payment
        const success = await capturePayPalPurchase(token);
        if (success) {
          // Fetch the completed purchase
          await fetchPurchase(token);
        }
      } else {
        // Check if there's a purchase reference in localStorage or URL
        setIsLoading(false);
      }
    };

    const fetchPurchase = async (orderIdOrReference?: string) => {
      try {
        let query = supabase
          .from('download_purchases')
          .select(`
            *,
            products (*)
          `)
          .eq('status', 'completed');

        if (orderIdOrReference) {
          query = query.or(`paypal_order_id.eq.${orderIdOrReference},order_reference.eq.${orderIdOrReference}`);
        }

        const { data } = await query.order('created_at', { ascending: false }).limit(1);
        
        if (data && data.length > 0) {
          setPurchase(data[0]);
        }
      } catch (error) {
        console.error('Error fetching purchase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    handlePayPalReturn();
  }, [searchParams, capturePayPalPurchase]);

  const generateDownloadUrl = async () => {
    if (!purchase?.products?.download_file_path) return null;
    
    try {
      const { data } = await supabase.storage
        .from('downloads')
        .createSignedUrl(purchase.products.download_file_path, 3600); // 1 hour expiry
      
      return data?.signedUrl;
    } catch (error) {
      console.error('Error generating download URL:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    const url = await generateDownloadUrl();
    if (url) {
      window.open(url, '_blank');
      
      // Mark as downloaded
      await supabase
        .from('download_purchases')
        .update({ downloaded_at: new Date().toISOString() })
        .eq('id', purchase.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-3xl font-playfair">Purchase Not Found</h1>
          <p className="text-muted-foreground">
            We couldn't find your purchase. If you just completed a payment, it may take a few minutes to process.
          </p>
          <Button asChild>
            <Link to="/authentication-demo">Return to Demo</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPendingBankTransfer = purchase.status === 'pending_bank_transfer';
  const isCompleted = purchase.status === 'completed';

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          {isCompleted ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-3xl font-playfair">Purchase Complete!</h1>
              <p className="text-muted-foreground">
                Thank you for purchasing {purchase.products?.name}. Your download is ready.
              </p>
            </>
          ) : (
            <>
              <Clock className="h-16 w-16 text-orange-500 mx-auto" />
              <h1 className="text-3xl font-playfair">Order Created</h1>
              <p className="text-muted-foreground">
                Your order has been created. Complete the bank transfer to access your download.
              </p>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Order Reference:</span>
                <span className="font-mono">{purchase.order_reference}</span>
              </div>
              <div className="flex justify-between">
                <span>Product:</span>
                <span>{purchase.products?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>{purchase.currency} {purchase.amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="capitalize">{purchase.payment_method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`capitalize ${isCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                  {purchase.status.replace('_', ' ')}
                </span>
              </div>
              {purchase.download_expires_at && (
                <div className="flex justify-between">
                  <span>Download Expires:</span>
                  <span>{new Date(purchase.download_expires_at).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download or Payment Instructions */}
          {isCompleted ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download Your Purchase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your download includes the complete source code, documentation, and setup instructions.
                </p>
                <Button onClick={handleDownload} className="w-full" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Now
                </Button>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Download expires in 30 days. Save the files to your local system.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p><strong>Bank:</strong> First Citizens Bank</p>
                  <p><strong>Account:</strong> 2991223</p>
                  <p><strong>Account Type:</strong> Savings</p>
                  <p><strong>Reference:</strong> {purchase.order_reference}</p>
                  <p><strong>Amount:</strong> TTD 1,010.62</p>
                </div>
                <Separator />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    📲 Send payment screenshot to WhatsApp with your order reference
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const message = `Payment proof for order ${purchase.order_reference}. I have completed the bank transfer for TTD 1,010.62 to First Citizens Bank Account 2991223 with reference ${purchase.order_reference}.`;
                      window.open(`https://wa.me/18687865357?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Send to WhatsApp (868) 786-5357
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* What's Included & Instructions */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {purchase.products?.features?.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">System Requirements:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Node.js 18+ and npm/yarn</li>
                    <li>Database (PostgreSQL recommended)</li>
                    <li>Email service (SMTP/SendGrid)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">Compatible Platforms:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Vercel, Netlify, Railway</li>
                    <li>DigitalOcean, AWS, Google Cloud</li>
                    <li>Any Node.js hosting platform</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Limitations:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Self-hosting requires technical knowledge</li>
                    <li>No ongoing support included</li>
                    <li>You handle security updates</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Disclaimers */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This is a final sale with no refunds. The download package includes complete 
            source code and documentation, but ongoing support is not included. Self-hosting requires technical 
            knowledge of web development and server management.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Button variant="outline" asChild>
            <Link to="/authentication-demo">Return to Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}