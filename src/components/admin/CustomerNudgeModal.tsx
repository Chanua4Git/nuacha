import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { openWhatsApp, replaceTemplateVariables } from '@/utils/whatsapp';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  message_template: string;
  variables: string[];
}

interface CustomerNudgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  orderContext?: {
    order_reference: string;
    plan_type: string;
    amount: string;
    payment_confirmed: boolean;
  };
}

export function CustomerNudgeModal({ 
  open, 
  onOpenChange, 
  customer, 
  orderContext 
}: CustomerNudgeModalProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setTemplates((data as WhatsAppTemplate[]) || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Replace variables with actual values
    const context: Record<string, string | undefined> = {
      customer_name: customer.name,
      order_reference: orderContext?.order_reference,
      plan_type: orderContext?.plan_type,
      amount: orderContext?.amount
    };
    
    const filledMessage = replaceTemplateVariables(template.message_template, context);
    setCustomMessage(filledMessage);
  };

  const handleSendMessage = () => {
    if (!customer.phone || !customMessage.trim()) {
      toast({
        title: "Missing information",
        description: "Phone number and message are required.",
        variant: "destructive"
      });
      return;
    }
    
    openWhatsApp(customer.phone, customMessage);
    
    toast({
      title: "WhatsApp opened",
      description: "Message pre-filled and ready to send."
    });
    
    onOpenChange(false);
  };

  const suggestedTemplateCategory = orderContext?.payment_confirmed 
    ? 'payment_confirmation' 
    : 'payment_reminder';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" />
            Send WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Send a message to {customer.name} ({customer.phone})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Choose a Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem 
                    key={template.id} 
                    value={template.id}
                    className={template.category === suggestedTemplateCategory ? 'bg-primary/5' : ''}
                  >
                    {template.name}
                    {template.category === suggestedTemplateCategory && (
                      <span className="ml-2 text-xs text-primary">(Suggested)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Editor */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type your message or select a template above..."
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              You can edit the message before sending.
            </p>
          </div>

          {/* Order Context */}
          {orderContext && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order:</span>
                <span className="font-mono">{orderContext.order_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="capitalize">{orderContext.plan_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span>${orderContext.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span>{orderContext.payment_confirmed ? '✅ Confirmed' : '⏳ Pending'}</span>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={handleSendMessage}
            disabled={!customMessage.trim()}
          >
            <Send className="h-4 w-4" />
            Open WhatsApp & Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
