import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export interface ReceiptScanLeadCaptureData {
  email: string;
  name: string;
  businessType: string;
  receiptVolume: string;
  currentTrackingMethod: string;
  additionalInfo: string;
}

interface ReceiptScanLeadCaptureFormProps {
  onSubmit: (data: ReceiptScanLeadCaptureData) => void;
  isLoading?: boolean;
}

export default function ReceiptScanLeadCaptureForm({ onSubmit, isLoading = false }: ReceiptScanLeadCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [receiptVolume, setReceiptVolume] = useState("");
  const [currentTrackingMethod, setCurrentTrackingMethod] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !name || !businessType || !receiptVolume) {
      return;
    }
    
    // Submit the lead to Supabase before redirecting
    const leadData = {
      email,
      name,
      business_type: businessType,
      additional_info: JSON.stringify({
        receipt_volume: receiptVolume,
        current_tracking_method: currentTrackingMethod,
        notes: additionalInfo
      }),
      interest_type: 'receipt_scan_demo'
    };

    try {
      const { error } = await supabase
        .from('demo_leads')
        .insert([leadData]);
      
      if (error) {
        console.error('Error saving lead:', error);
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
    }
    
    onSubmit({
      email,
      name,
      businessType,
      receiptVolume,
      currentTrackingMethod,
      additionalInfo
    });
  }

  const isFormValid = email && name && businessType && receiptVolume;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessType">Primary use case *</Label>
        <Select value={businessType} onValueChange={setBusinessType}>
          <SelectTrigger>
            <SelectValue placeholder="How will you use receipt scanning?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal/Family expenses</SelectItem>
            <SelectItem value="small_business">Small business</SelectItem>
            <SelectItem value="freelance">Freelance/Self-employed</SelectItem>
            <SelectItem value="household_management">Household management</SelectItem>
            <SelectItem value="tax_preparation">Tax preparation</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="receiptVolume">How many receipts per month? *</Label>
        <Select value={receiptVolume} onValueChange={setReceiptVolume}>
          <SelectTrigger>
            <SelectValue placeholder="Select volume" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-10">1-10 receipts</SelectItem>
            <SelectItem value="11-25">11-25 receipts</SelectItem>
            <SelectItem value="26-50">26-50 receipts</SelectItem>
            <SelectItem value="51-100">51-100 receipts</SelectItem>
            <SelectItem value="100+">100+ receipts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentTrackingMethod">Current tracking method</Label>
        <Select value={currentTrackingMethod} onValueChange={setCurrentTrackingMethod}>
          <SelectTrigger>
            <SelectValue placeholder="How do you currently track expenses?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual/Paper records</SelectItem>
            <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
            <SelectItem value="expense_app">Expense tracking app</SelectItem>
            <SelectItem value="photo_gallery">Photos in gallery</SelectItem>
            <SelectItem value="none">No organized system</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalInfo">What excites you most about automated receipt scanning?</Label>
        <Textarea
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="e.g., saving time, better organization, tax preparation..."
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? "Processing..." : "Show me the amazing results!"}
      </Button>
    </form>
  );
}