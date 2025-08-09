import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Building2, ExternalLink, Star, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WhiteLabelPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WhiteLabelPurchaseModal({ open, onOpenChange }: WhiteLabelPurchaseModalProps) {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderReference, setOrderReference] = useState("");
  const [activeTab, setActiveTab] = useState("paypal");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  const whatsAppMessage = `White Label Service Purchase - Order ${orderReference || 'NEW'}

Company: ${companyName}
Contact: ${userName} (${userEmail})

Project Overview:
${projectDescription}

I'm ready to start the White Label Service (TTD $4,000 / USD $590 per month, 4-month minimum).

Please confirm receipt and schedule our initial consultation.`;

  const features = [
    "Initial consultation and requirements gathering",
    "PRD (Product Requirements Document) creation and sign-off",
    "Tailor-made development of your engineered solution",
    "Branding and white-label customization",
    "Advanced integrations and workflow automation",
    "Industry-specific feature development",
    "Deployment to agreed infrastructure",
    "Documentation, training, and handover"
  ];

  const conditions = [
    "Work is scoped based on the approved PRD; any changes require a formal change request and may affect cost/timeline",
    "Project duration: 4 months minimum on a monthly retainer (TTD $4,000 / USD $590)",
    "Payment is due monthly in advance; late payment may pause work",
    "Communication via agreed project channels only (e.g., email, Slack, project board)",
    "Intellectual property for custom code belongs to the client upon final payment",
    "Final deliverables are accepted after testing and sign-off",
    "No refunds for work completed within billed periods"
  ];

  const handlePayPalPurchase = async () => {
    if (!userEmail || !userName || !companyName || !termsAccepted) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields and accept the terms.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Generate a temporary order reference
    const newOrderRef = `WL-${Date.now().toString().slice(-6)}`;
    setOrderReference(newOrderRef);
    
    // Here you would integrate with your PayPal subscription API
    toast({
      title: "PayPal Integration Coming Soon",
      description: "Please use WhatsApp contact for now to set up your monthly retainer.",
    });
    setIsLoading(false);
  };

  const handleContact = () => {
    if (!userEmail || !userName || !companyName) {
      toast({
        title: "Required fields missing",
        description: "Please fill in your contact details first.",
        variant: "destructive",
      });
      return;
    }

    const newOrderRef = `WL-${Date.now().toString().slice(-6)}`;
    setOrderReference(newOrderRef);
    
    const whatsappUrl = `https://wa.me/18687865357?text=${encodeURIComponent(whatsAppMessage.replace('NEW', newOrderRef))}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-playfair">White Label Service – Your Own Engineer on Retainer</DialogTitle>
          <DialogDescription>
            For TTD $4,000 / USD $590 per month (4-month minimum), get a dedicated Engineer to design, build, and deliver tailor-made solutions for your business.
          </DialogDescription>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Service Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What's Included</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Important Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-xs text-orange-700 space-y-2">
                  {conditions.map((condition, index) => (
                    <li key={index}>• {condition}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Payment Form */}
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
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="project">Project Description</Label>
                <textarea
                  id="project"
                  className="w-full min-h-[80px] px-3 py-2 text-sm border border-input bg-background rounded-md"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Brief description of your project requirements..."
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paypal" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  PayPal - $590 USD/mo
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Contact - TTD 4,000/mo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paypal" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Set up a monthly subscription via PayPal. First payment reserves your build slot.
                    </p>
                    <div className="text-2xl font-bold text-primary">$590.00 USD/month</div>
                    <p className="text-xs text-muted-foreground mt-1">4-month minimum commitment</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="font-medium">Direct Contact</h4>
                    <p className="text-sm text-muted-foreground">
                      Contact us directly via WhatsApp to discuss your project and set up monthly invoicing.
                    </p>
                    <div className="text-2xl font-bold text-primary">TTD 4,000/month</div>
                    <p className="text-xs text-muted-foreground">4-month minimum commitment</p>
                    
                    {orderReference && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 mb-2">
                          📲 Your consultation request has been prepared
                        </p>
                        <p className="text-xs text-blue-600 mb-2">Reference: {orderReference}</p>
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
                I accept the terms and conditions including the 4-month minimum commitment, 
                monthly advance payment structure, and project scope limitations as outlined above.
              </label>
            </div>

            <Separator />

            <div className="space-y-3">
              {activeTab === "paypal" ? (
                <Button
                  onClick={handlePayPalPurchase}
                  disabled={!userEmail || !userName || !companyName || !termsAccepted || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Processing..." : "Set Up Monthly Subscription - $590 USD"}
                </Button>
              ) : (
                <Button
                  onClick={handleContact}
                  disabled={!userEmail || !userName || !companyName}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact via WhatsApp
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}