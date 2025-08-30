import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export interface ExitIntentLeadCaptureData {
  email: string;
  name: string;
  interestType: string;
  phone?: string;
  source: string;
}

interface ExitIntentLeadCaptureFormProps {
  onSubmit: (data: ExitIntentLeadCaptureData) => void;
  isLoading?: boolean;
}

export default function ExitIntentLeadCaptureForm({ 
  onSubmit, 
  isLoading 
}: ExitIntentLeadCaptureFormProps) {
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
      interestType: interestType || 'general',
      phone,
      source: 'exit-intent'
    });
  };

  const isValid = email.trim() && name.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="h-11"
        />

        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="h-11"
        />

        <div className="space-y-1">
          <PhoneInput
            international
            countryCallingCodeEditable={false}
            defaultCountry="TT"
            value={phone}
            onChange={setPhone}
            placeholder="Phone (optional)"
            className="phone-input h-11 px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
          />
        </div>

        <Select value={interestType} onValueChange={setInterestType}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="What interests you most?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense-tracking">Expense tracking</SelectItem>
            <SelectItem value="budgeting">Personal budgeting</SelectItem>
            <SelectItem value="payroll">Trinidad & Tobago payroll</SelectItem>
            <SelectItem value="family-finances">Family financial management</SelectItem>
            <SelectItem value="general">General interest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        type="submit" 
        className="w-full h-11" 
        disabled={isLoading || !isValid}
      >
        {isLoading ? "Getting updates..." : "Get early access updates"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        No spam, just gentle updates on Nuacha's journey.
      </p>
    </form>
  );
}