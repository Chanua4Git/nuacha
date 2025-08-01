import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface PayrollLeadCaptureData {
  email: string;
  name: string;
  businessType: string;
  employeeCount: string;
  currentPayrollMethod: string;
  additionalInfo: string;
}

interface PayrollLeadCaptureFormProps {
  onSubmit: (data: PayrollLeadCaptureData) => void;
  isLoading?: boolean;
}

export default function PayrollLeadCaptureForm({ onSubmit, isLoading = false }: PayrollLeadCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [currentPayrollMethod, setCurrentPayrollMethod] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !name || !businessType || !employeeCount) {
      return;
    }
    
    onSubmit({
      email,
      name,
      businessType,
      employeeCount,
      currentPayrollMethod,
      additionalInfo,
    });
  }

  const isFormValid = email && name && businessType && employeeCount;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full name *</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessType">Type of business *</Label>
        <Select value={businessType} onValueChange={setBusinessType}>
          <SelectTrigger>
            <SelectValue placeholder="Select business type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small_business">Small Business</SelectItem>
            <SelectItem value="medium_business">Medium Business</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
            <SelectItem value="non_profit">Non-Profit</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employeeCount">Number of employees *</Label>
        <Select value={employeeCount} onValueChange={setEmployeeCount}>
          <SelectTrigger>
            <SelectValue placeholder="Select employee count" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-5">1-5 employees</SelectItem>
            <SelectItem value="6-10">6-10 employees</SelectItem>
            <SelectItem value="11-25">11-25 employees</SelectItem>
            <SelectItem value="26-50">26-50 employees</SelectItem>
            <SelectItem value="51-100">51-100 employees</SelectItem>
            <SelectItem value="100+">100+ employees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentPayrollMethod">Current payroll method</Label>
        <Select value={currentPayrollMethod} onValueChange={setCurrentPayrollMethod}>
          <SelectTrigger>
            <SelectValue placeholder="How do you currently handle payroll?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual calculations</SelectItem>
            <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
            <SelectItem value="payroll_software">Payroll software</SelectItem>
            <SelectItem value="outsourced">Outsourced to accountant</SelectItem>
            <SelectItem value="none">No formal process</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalInfo">Additional information</Label>
        <Textarea
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Any specific payroll challenges or requirements?"
          rows={3}
        />
      </div>

      <Button
        ref={submitButtonRef}
        type="submit"
        className="w-full"
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? "Processing..." : "Get started with payroll"}
      </Button>
    </form>
  );
}