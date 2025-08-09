import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Building2, ExternalLink, Star } from "lucide-react";
import { useDownloadPurchase, type DownloadProduct } from "@/hooks/useDownloadPurchase";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DownloadPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DownloadPurchaseModal({ open, onOpenChange }: DownloadPurchaseModalProps) {
  const [product, setProduct] = useState<DownloadProduct | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderReference, setOrderReference] = useState("");
  const [activeTab, setActiveTab] = useState("paypal");
  
  const { getProduct, createPayPalPurchase, createBankTransferPurchase, isLoading } = useDownloadPurchase();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Load the download product (assuming we have one product for now)
      const loadProduct = async () => {
        // In a real app, you'd pass the product ID or fetch it differently
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .limit(1);
        
        if (products && products.length > 0) {
          const product = products[0];
          setProduct({
            ...product,
            features: Array.isArray(product.features) 
              ? product.features.filter((f): f is string => typeof f === 'string')
              : []
          });
        }
      };
      loadProduct();
    }
  }, [open]);

  const handlePayPalPurchase = async () => {
    if (!product || !userEmail || !termsAccepted) return;

    const result = await createPayPalPurchase({
      productId: product.id,
      userEmail,
      userName,
      paymentMethod: 'paypal'
    });

    if (result?.approvalUrl) {
      window.location.href = result.approvalUrl;
    }
  };

  const handleBankTransferPurchase = async () => {
    if (!product || !userEmail || !termsAccepted) return;

    const result = await createBankTransferPurchase({
      productId: product.id,
      userEmail,
      userName,
      paymentMethod: 'bank_transfer'
    });

    if (result?.orderReference) {
      setOrderReference(result.orderReference);
    }
  };

  const openWhatsApp = () => {
    const message = `Payment proof for order ${orderReference}. I have completed the bank transfer for TTD 1,010.62 to First Citizens Bank Account 2991223 with reference ${orderReference}.`;
    const whatsappUrl = `https://wa.me/18687865357?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-playfair">Purchase {product.name}</DialogTitle>
          <DialogDescription>
            Get complete source code with advanced features for self-hosting
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-orange-800 mb-2">Important Disclaimers</h4>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Self-hosting requires technical knowledge</li>
                  <li>• No ongoing support included</li>
                  <li>• Final sale - no refunds</li>
                  <li>• Download access valid for 30 days</li>
                  <li>• Compatible with major hosting platforms</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paypal" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  PayPal - $149 USD
                </TabsTrigger>
                <TabsTrigger value="bank" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank Transfer - 1,010.62 TTD
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paypal" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Pay securely with PayPal. You'll be redirected to complete your payment.
                    </p>
                    <div className="text-2xl font-bold text-primary">$149.00 USD</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bank" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-medium">Bank Transfer Details</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Bank:</strong> First Citizens Bank</p>
                      <p><strong>Account:</strong> 2991223</p>
                      <p><strong>Account Type:</strong> Savings</p>
                      {orderReference && (
                        <p><strong>Reference:</strong> {orderReference}</p>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-primary">1,010.62 TTD</div>
                    
                    {orderReference && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">
                          📲 Send payment screenshot to WhatsApp with order reference
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={openWhatsApp}
                          className="w-full"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open WhatsApp (868) 786-5357
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <label htmlFor="terms" className="text-xs leading-relaxed">
                I accept the terms and conditions. I understand this is a final sale with no refunds, 
                and that self-hosting requires technical knowledge. Download access is valid for 30 days.
              </label>
            </div>

            <Separator />

            <div className="space-y-3">
              {activeTab === "paypal" ? (
                <Button
                  onClick={handlePayPalPurchase}
                  disabled={!userEmail || !termsAccepted || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Processing..." : "Pay with PayPal - $149 USD"}
                </Button>
              ) : (
                <Button
                  onClick={handleBankTransferPurchase}
                  disabled={!userEmail || !termsAccepted || isLoading || !!orderReference}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Creating Order..." : orderReference ? "Order Created" : "Create Bank Transfer Order"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}