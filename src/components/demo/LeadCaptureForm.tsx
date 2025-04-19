
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface LeadCaptureFormProps {
  onSubmit: (data: {
    email: string;
    name: string;
    interestType: string;
    additionalInfo: string;
  }) => void;
  isLoading?: boolean;
}

const LeadCaptureForm = ({ onSubmit, isLoading }: LeadCaptureFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interestType, setInterestType] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email,
      name,
      interestType,
      additionalInfo,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Name
        </label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="interestType" className="block text-sm font-medium text-foreground mb-1">
          Why are you interested in Nuacha?
        </label>
        <Select value={interestType} onValueChange={setInterestType} required>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your interest" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            <SelectItem value="personal">Personal use</SelectItem>
            <SelectItem value="family">Family expense management</SelectItem>
            <SelectItem value="small-business">Small business</SelectItem>
            <SelectItem value="large-business">Large business</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="additionalInfo" className="block text-sm font-medium text-foreground">
          Anything else you'd like to tell us?
        </label>
        <Textarea
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Share any questions or thoughts"
          className="h-24 mb-4"
        />
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : "Get My Report"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Your information will be used to send you the expense report and provide relevant updates.
        We respect your privacy.
      </p>
    </form>
  );
};

export default LeadCaptureForm;
