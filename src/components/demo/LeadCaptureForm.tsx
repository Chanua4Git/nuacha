import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";

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
  const submitButtonRef = useRef<HTMLDivElement>(null);

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
    <div className="max-h-[80vh] overflow-y-auto relative rounded-lg pb-[200px]">
      <form onSubmit={handleSubmit} className="space-y-8 relative">
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
            <label htmlFor="interestType" className="block text-sm font-medium text-foreground">
              Why are you interested in Nuacha?
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
                portal={false}
                position="popper"
                className="w-full bg-popover shadow-lg z-[9999]"
                align="start"
                sideOffset={5}
                collisionPadding={20}
              >
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
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="pt-6" ref={submitButtonRef}>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Get My Report"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Your information will be used to send you the expense report and provide relevant updates.
            We respect your privacy.
          </p>
        </div>
      </form>
    </div>
  );
};

export default LeadCaptureForm;
