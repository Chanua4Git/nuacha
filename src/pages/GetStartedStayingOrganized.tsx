import { PainPointHero } from "@/components/sales/PainPointHero";
import { AgitationSection } from "@/components/sales/AgitationSection";
import { SolutionBridge } from "@/components/sales/SolutionBridge";
import { ProductShowcase } from "@/components/sales/ProductShowcase";
import { ValueStackPricing } from "@/components/sales/ValueStackPricing";
import { TestimonialsSection } from "@/components/sales/TestimonialsSection";
import { FAQSection } from "@/components/sales/FAQSection";
import { FinalCTA } from "@/components/sales/FinalCTA";
import { Receipt, Users, PiggyBank, Bell, FileText, Camera } from "lucide-react";

const GetStartedFamilies = () => {
  const agitationItems = [
    {
      emoji: "📝",
      title: "Receipts everywhere",
      description: "Scattered across notebooks, apps, your camera roll, and that drawer you've been avoiding.",
    },
    {
      emoji: "💸",
      title: "\"Whose money paid for this?\"",
      description: "Managing parents, kids, and your own expenses? Good luck knowing which pocket it came from.",
    },
    {
      emoji: "👶",
      title: "Per-child mystery",
      description: "School fees, clothes, activities... you know it adds up, but how much exactly?",
    },
    {
      emoji: "📊",
      title: "Budget overwhelm",
      description: "Spreadsheets feel like homework. Apps feel too complicated. So you just... don't.",
    },
  ];

  const showcaseItems = [
    {
      icon: Camera,
      title: "Smart Receipt Scanning",
      description: "Snap a photo of any receipt. Our AI extracts the vendor, amount, date, and even individual items automatically.",
    },
    {
      icon: Users,
      title: "Multi-Family Dashboard",
      description: "Track expenses for your household, your parents, your in-laws—all separate, all organized.",
    },
    {
      icon: PiggyBank,
      title: "Budget Builder",
      description: "Use the 50/30/20 rule or create your own. See exactly where you stand each month.",
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Never forget a bill due date or insurance renewal. We'll gently remind you before it's too late.",
    },
  ];

  const valueItems = [
    { feature: "10GB Secure Storage", value: "TT$50/mo" },
    { feature: "Unlimited Receipt Scanning", value: "TT$40/mo" },
    { feature: "Multi-Family Expense Tracking", value: "TT$35/mo" },
    { feature: "Budget Builder (50/30/20)", value: "TT$25/mo" },
    { feature: "Per-Member Expense Assignment", value: "TT$20/mo" },
    { feature: "Smart Reminders & Due Dates", value: "TT$15/mo" },
    { feature: "Financial Reports & Export", value: "TT$15/mo" },
  ];

  const testimonials = [
    {
      quote: "Finally, I can show my husband exactly where the household money goes each month. No more guessing.",
      author: "Keisha M.",
      role: "Mother of 3, Port of Spain",
    },
    {
      quote: "I manage expenses for my elderly mother and my own family. Nuacha keeps everything separate and organized.",
      author: "Anita R.",
      role: "Caregiver & Mom",
    },
    {
      quote: "The receipt scanning is magic. I just snap a photo and it's all filled in. Such a time saver!",
      author: "Michelle T.",
      role: "Stay-at-home Mom",
    },
  ];

  const faqs = [
    {
      question: "Can I track my parents' expenses separately from my own?",
      answer: "Absolutely! Nuacha lets you create separate 'families' for each household you manage. Your parents' expenses stay completely separate from yours, with their own budgets and reports.",
    },
    {
      question: "Is my financial data secure?",
      answer: "Yes. We use bank-level encryption to protect your data. Your information is never sold or shared with third parties. We take privacy seriously.",
    },
    {
      question: "Do I need to be tech-savvy to use this?",
      answer: "Not at all! Nuacha is designed to be as simple as possible. If you can take a photo with your phone, you can use Nuacha. No spreadsheet skills required.",
    },
    {
      question: "Can I assign expenses to specific family members?",
      answer: "Yes! You can track expenses per family member (like school fees for each child). This helps you understand exactly how much you're spending on each person.",
    },
    {
      question: "What makes this different from a spreadsheet?",
      answer: "Nuacha does the work for you. Just scan your receipts and we organize everything automatically. No formulas, no manual data entry, no formatting headaches.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      <PainPointHero
        headline="You juggle groceries, school fees, doctor visits, and caregiving costs..."
        subheadline="And at month's end, you still wonder where all the money went. There's a gentler way."
      />
      
      <AgitationSection items={agitationItems} />
      
      <SolutionBridge
        headline="What if managing your family's finances could feel... peaceful?"
        subheadline="Nuacha is a calm, mindful expense tracker designed for multi-family managers like you. No judgment. No stress. Just clarity."
        features={["Simple", "Organized", "Peaceful"]}
      />
      
      <ProductShowcase items={showcaseItems} />
      
      <ValueStackPricing
        items={valueItems}
        totalValue="TT$200/month"
        actualPriceTTD="TT$149"
        actualPriceUSD="~US$21.91"
        storageTier="10GB storage included"
        badge="Staying Organized - Most Popular"
        planType="staying_organized"
      />
      
      <TestimonialsSection
        testimonials={testimonials}
        headline="Loved by families across T&T"
      />
      
      <FAQSection faqs={faqs} />
      
      <FinalCTA
        headline="Ready to stop wondering where the money went?"
        subheadline="Join hundreds of families already finding peace with Nuacha."
        planType="staying_organized"
      />
    </div>
  );
};

export default GetStartedFamilies;
