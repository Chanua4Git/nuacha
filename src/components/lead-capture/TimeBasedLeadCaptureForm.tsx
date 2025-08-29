import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface TimeBasedLeadCaptureData {
  email: string;
  name: string;
  interestType: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !name.trim()) return;
    
    onSubmit({
      email: email.trim(),
      name: name.trim(),
      interestType: interestType || "General Interest",
      source: "time-based"
    });
  };

  const isFormValid = email.trim() && name.trim();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end w-full">
      <div className="flex-1 min-w-0">
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-9 text-sm"
          disabled={isLoading}
        />
      </div>
      
      <div className="flex-1 min-w-0">
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

      <div className="flex-1 min-w-0">
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

      <Button 
        type="submit" 
        disabled={!isFormValid || isLoading}
        className="h-9 px-6 whitespace-nowrap"
        size="sm"
      >
        {isLoading ? "Submitting..." : "Get Updates"}
      </Button>
    </form>
  );
}