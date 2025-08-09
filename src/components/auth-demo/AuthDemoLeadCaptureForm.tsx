
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type AuthDemoLeadCaptureData = {
  email: string;
  name: string;
  interestType: string;
  additionalInfo: string;
};

interface AuthDemoLeadCaptureFormProps {
  onSubmit: (data: AuthDemoLeadCaptureData) => void;
  isLoading?: boolean;
}

export default function AuthDemoLeadCaptureForm({ onSubmit, isLoading }: AuthDemoLeadCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [interestType, setInterestType] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const submitButtonRef = useRef<HTMLDivElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (interestType && email && name) {
      onSubmit({ email, name, interestType, additionalInfo });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
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
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
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
          onOpenChange={open => {
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
            <SelectItem value="comparison">Comparing authentication tools</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label htmlFor="demo-additional" className="block text-sm font-medium text-foreground">
          Anything else you'd like to share?
        </label>
        <Textarea
          id="demo-additional"
          value={additionalInfo}
          onChange={e => setAdditionalInfo(e.target.value)}
          placeholder="Questions, context, or anything else…"
          className="min-h-[90px]"
        />
      </div>
      <div ref={submitButtonRef}>
        <Button type="submit" className="w-full mt-4" disabled={isLoading || !interestType || !email || !name}>
          {isLoading ? "Sending..." : "Continue to Sign Up"}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Your info won’t be sold or spammed. This just helps us shape Nuacha.
        </p>
      </div>
    </form>
  );
}
