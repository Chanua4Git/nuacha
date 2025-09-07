
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, PlusCircle, ListFilter, Tag, Calculator, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DemoBreadcrumbs from '@/components/DemoBreadcrumbs';
import { DemoExpenseProvider } from '@/context/DemoExpenseContext';
import { DemoExpenseProvider as DemoExpenseContextProvider } from '@/components/demo/DemoExpenseContext';
import DemoReceiptUploadSection from '@/components/demo/DemoReceiptUploadSection';
import DemoAwareExpenseList from '@/components/demo/DemoAwareExpenseList';
import DemoAwareFamilySelector from '@/components/demo/DemoAwareFamilySelector';
import DemoAwareRemindersList from '@/components/demo/DemoAwareRemindersList';
import { OCRResult } from '@/types/expense';
import LeadCaptureForm from '@/components/demo/LeadCaptureForm';
import ReceiptScanLeadCaptureModal from '@/components/demo/ReceiptScanLeadCaptureModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


const Demo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'expenses';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showLeadCaptureModal, setShowLeadCaptureModal] = useState(false);
  const [showReceiptScanLeadCapture, setShowReceiptScanLeadCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptOcrData, setReceiptOcrData] = useState<{extractedData: OCRResult, receiptUrl: string} | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'expenses';
    setActiveTab(tab);
  }, [searchParams]);

  // Handle incoming data from Landing page - show lead capture first
  useEffect(() => {
    const state = location.state as any;
    if (state?.extractedData && state?.receiptUrl && state?.preProcessed) {
      // Store OCR data for later use
      setReceiptOcrData({
        extractedData: state.extractedData,
        receiptUrl: state.receiptUrl
      });
      // Show receipt scan lead capture modal first
      setShowReceiptScanLeadCapture(true);
    }
  }, [location.state]);

  const handleTabChange = (value: string) => {
    if (value === 'budget') {
      navigate('/demo/budget');
    } else if (value === 'signup') {
      setShowLeadCaptureModal(true);
    } else {
      setActiveTab(value);
      setSearchParams({ tab: value });
    }
  };

  const handleLeadSubmit = async (data: {
    email: string;
    name: string;
    interestType: string;
    additionalInfo: string;
    phone?: string;
  }) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('demo_leads').insert({
        email: data.email,
        name: data.name,
        interest_type: data.interestType,
        additional_info: data.additionalInfo,
        phone: data.phone,
        source: 'demo-full-experience',
        context: 'full_demo_app'
      });

      if (error?.code === '23505') {
        toast("Welcome back! Ready to get started?", {
          description: "Since you've explored our demo, let's get you signed up to unlock the full Nuacha experience!",
          action: {
            label: "Sign Up Now",
            onClick: () => navigate('/signup')
          }
        });
        setShowLeadCaptureModal(false);
        return;
      }

      if (error) throw error;

      toast.success("Thank you for trying Nuacha!");
      setShowLeadCaptureModal(false);
      
      // Offer to sign up
      setTimeout(() => {
        toast("Ready to unlock the full experience?", {
          description: "Sign up to save your data permanently and access all features.",
          action: {
            label: "Sign Up Now",
            onClick: () => navigate('/signup')
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiptScanLeadCaptureComplete = () => {
    // After lead capture is complete, show the populated form
    setActiveTab('add-expense');
    setSearchParams({ tab: 'add-expense' });
    toast.success("Receipt data loaded!", {
      description: "Your receipt has been processed. Complete the expense entry below."
    });
  };

  return (
    <DemoExpenseProvider>
      <DemoExpenseContextProvider>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <DemoBreadcrumbs currentPage="demo" />
          
          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold tracking-tight">Try Nuacha's Full Experience</h1>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Demo Mode
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Experience the complete Nuacha workflow - from receipt scanning to expense analytics
              </p>
            </div>
            
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You're experiencing Nuacha's full capabilities in demo mode. Your data is saved locally during this session. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-medium ml-1" 
                  onClick={() => setShowLeadCaptureModal(true)}
                >
                  Sign up to save permanently
                </Button>
              </AlertDescription>
            </Alert>
            
            <div className="flex flex-col md:flex-row md:items-start gap-4 mb-8">
              <div className="flex-1">
                <DemoAwareFamilySelector />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowLeadCaptureModal(true)} 
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Try Full App
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="expenses">
                      <ListFilter className="h-4 w-4 mr-2" />
                      Expenses
                    </TabsTrigger>
                    <TabsTrigger value="add-expense">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Expense
                    </TabsTrigger>
                    <TabsTrigger value="budget">
                      <Calculator className="h-4 w-4 mr-2" />
                      Budget
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="bg-primary/10 text-primary hover:bg-primary/20">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Try Full App
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="expenses" className="mt-0">
                    <DemoAwareExpenseList />
                  </TabsContent>
                  <TabsContent value="add-expense" className="mt-0">
                   <DemoReceiptUploadSection 
                     initialOcrData={receiptOcrData?.extractedData}
                     receiptUrl={receiptOcrData?.receiptUrl}
                     requireLeadCaptureInDemo={true}
                     onScanComplete={(data, url) => {
                       setReceiptOcrData({ extractedData: data, receiptUrl: url || '' });
                       setShowReceiptScanLeadCapture(true);
                     }}
                   />
                  </TabsContent>
                </Tabs>
              </div>
              
              <div>
                <div className="space-y-6">
                  <DemoAwareRemindersList />
                  
                  {/* Demo Features Showcase */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Demo Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>✓ Full receipt scanning</p>
                        <p>✓ Expense management</p>
                        <p>✓ Category organization</p>
                        <p>✓ Recurring expenses</p>
                        <p>✓ Budget integration</p>
                        <p>✓ Analytics & insights</p>
                      </div>
                      <Button 
                        className="w-full mt-3" 
                        size="sm"
                        onClick={() => setShowLeadCaptureModal(true)}
                      >
                        Unlock Full Version
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
          
          {/* Lead Capture Modal */}
          {showLeadCaptureModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Ready for the Full Experience?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Sign up to save your data permanently and unlock all features.
                  </p>
                  <LeadCaptureForm 
                    onSubmit={handleLeadSubmit} 
                    isLoading={isSubmitting}
                  />
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setShowLeadCaptureModal(false)}
                  >
                    Continue Demo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Receipt Scan Lead Capture Modal */}
          <ReceiptScanLeadCaptureModal
            open={showReceiptScanLeadCapture}
            onOpenChange={setShowReceiptScanLeadCapture}
            onComplete={handleReceiptScanLeadCaptureComplete}
          />
        </div>
      </DemoExpenseContextProvider>
    </DemoExpenseProvider>
  );
};

export default Demo;
