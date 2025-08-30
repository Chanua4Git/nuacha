
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface LeadCaptureFormProps {
  onSubmit: (data: {
    email: string;
    name: string;
    interestType: string;
    additionalInfo: string;
    phone?: string;
  }) => void;
  isLoading?: boolean;
}

const LeadCaptureForm = ({ onSubmit, isLoading }: LeadCaptureFormProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interestType, setInterestType] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const submitButtonRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, name, interestType, additionalInfo, phone });
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto overflow-visible relative rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
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
            <label htmlFor="phone" className="block text-sm font-medium text-foreground">
              Phone (optional)
            </label>
            <PhoneInput
              id="phone"
              international
              countryCallingCodeEditable={false}
              defaultCountry="TT"
              value={phone}
              onChange={setPhone}
              placeholder="Enter phone number"
              className="phone-input px-3 py-2 border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="interestType" className="block text-sm font-medium text-foreground">
              What brings you to Nuacha's authentication demo?
            </label>
            <Select
              value={interestType}
              onValueChange={setInterestType}
              required
              onOpenChange={(open) => {
                if (open && submitButtonRef.current) {
                  submitButtonRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
              }}
            >
              <SelectTrigger id="interestType" className="w-full">
                <SelectValue placeholder="Select your interest" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="w-full bg-popover shadow-lg z-[9999]"
                align="start"
                sideOffset={5}
                collisionPadding={20}
              >
                <SelectItem value="personal">Personal use</SelectItem>
                <SelectItem value="client-demo">Testing for client demo</SelectItem>
                <SelectItem value="developer">Developer review</SelectItem>
                <SelectItem value="comparing">Comparing authentication tools</SelectItem>
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
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="pb-[120px]">
          <div ref={submitButtonRef} className="bg-background py-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Processing..." : "Continue to Sign Up"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Your info won't be sold or spammed. This just helps us shape Nuacha.
          </p>
        </div>
      </form>
    </div>
  );
};

export default LeadCaptureForm;
