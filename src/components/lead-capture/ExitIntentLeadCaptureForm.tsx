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

export interface ExitIntentLeadCaptureData {
  email: string;
  name: string;
  interestType: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    
    onSubmit({ 
      email: email.trim(), 
      name: name.trim(), 
      interestType: interestType || 'general',
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