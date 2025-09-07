import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export interface BudgetLeadCaptureData {
  email: string;
  name: string;
  householdSize: string;
  dependents: string;
  customUnpaidLabor: string;
  additionalInfo: string;
}

interface BudgetLeadCaptureFormProps {
  onSubmit: (data: BudgetLeadCaptureData) => void;
  isLoading?: boolean;
}

export default function BudgetLeadCaptureForm({ onSubmit, isLoading = false }: BudgetLeadCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [householdSize, setHouseholdSize] = useState("");
  const [dependents, setDependents] = useState("");
  const [customUnpaidLabor, setCustomUnpaidLabor] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !name || !householdSize) {
      return;
    }
    
    // Submit the lead to Supabase before redirecting
    const leadData = {
      email,
      name,
      household_size: parseInt(householdSize) || 1,
      dependents: parseInt(dependents) || 0,
      additional_info: JSON.stringify({
        custom_unpaid_labor: customUnpaidLabor,
        notes: additionalInfo
      }),
      interest_type: 'budget_custom_unpaid_labor'
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
      householdSize,
      dependents,
      customUnpaidLabor,
      additionalInfo
    });
  }

  const isFormValid = email && name && householdSize;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
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
          <Label htmlFor="email">Email</Label>
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
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="householdSize">Household Size</Label>
          <Select value={householdSize} onValueChange={setHouseholdSize}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 person</SelectItem>
              <SelectItem value="2">2 people</SelectItem>
              <SelectItem value="3">3 people</SelectItem>
              <SelectItem value="4">4 people</SelectItem>
              <SelectItem value="5">5+ people</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="dependents">Dependents</Label>
          <Select value={dependents} onValueChange={setDependents}>
            <SelectTrigger>
              <SelectValue placeholder="Select number" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="customUnpaidLabor">Custom Unpaid Labor Category</Label>
        <Input
          id="customUnpaidLabor"
          type="text"
          value={customUnpaidLabor}
          onChange={(e) => setCustomUnpaidLabor(e.target.value)}
          placeholder="e.g., Pet Care, Elderly Care, Community Work"
        />
      </div>

      <div>
        <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
        <Textarea
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Tell us more about your unpaid labor needs..."
          rows={3}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? "Processing..." : "Get Custom Budget Features"}
      </Button>
    </form>
  );
}