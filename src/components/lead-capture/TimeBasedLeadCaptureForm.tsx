import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export interface TimeBasedLeadCaptureData {
  email: string;
  name: string;
  interestType: string;
  phone?: string;
  source: string;
}

interface TimeBasedLeadCaptureFormProps {
  onSubmit: (data: TimeBasedLeadCaptureData) => void;
  isLoading?: boolean;
}

export default function TimeBasedLeadCaptureForm({ onSubmit, isLoading = false }: TimeBasedLeadCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interestType, setInterestType] = useState("");
  const [phone, setPhone] = useState<string | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !name.trim()) return;
    
    onSubmit({
      email: email.trim(),
      name: name.trim(),
      interestType: interestType || "General Interest",
      phone,
      source: "time-based"
    });
  };

  const isFormValid = email.trim() && name.trim();

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-9 text-sm"
            disabled={isLoading}
          />
          
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-9 text-sm"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="phone-input-wrapper">
            <PhoneInput
              international
              countryCallingCodeEditable={false}
              defaultCountry="TT"
              value={phone}
              onChange={setPhone}
              placeholder="Phone (optional)"
              disabled={isLoading}
              className="phone-input h-9 px-3 py-1 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            />
          </div>

          <Select 
            value={interestType} 
            onValueChange={setInterestType}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Interest area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Household Budgeting">Household Budgeting</SelectItem>
              <SelectItem value="Expense Tracking">Expense Tracking</SelectItem>
              <SelectItem value="Payroll Management">Payroll Management</SelectItem>
              <SelectItem value="Financial Planning">Financial Planning</SelectItem>
              <SelectItem value="Business Solutions">Business Solutions</SelectItem>
              <SelectItem value="General Interest">General Interest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            disabled={!isFormValid || isLoading}
            className="w-full h-9"
            size="sm"
          >
            {isLoading ? "Submitting..." : "Get Updates"}
          </Button>
        </div>
      </form>
    </div>
  );
}