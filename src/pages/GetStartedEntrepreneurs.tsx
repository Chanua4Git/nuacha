import { PainPointHero } from "@/components/sales/PainPointHero";
import { AgitationSection } from "@/components/sales/AgitationSection";
import { SolutionBridge } from "@/components/sales/SolutionBridge";
import { ProductShowcase } from "@/components/sales/ProductShowcase";
import { ValueStackPricing } from "@/components/sales/ValueStackPricing";
import { TestimonialsSection } from "@/components/sales/TestimonialsSection";
import { FAQSection } from "@/components/sales/FAQSection";
import { FinalCTA } from "@/components/sales/FinalCTA";
import { Briefcase, Home, Calculator, Camera, Users, PiggyBank, FileText, Bell } from "lucide-react";

const GetStartedEntrepreneurs = () => {
  const agitationItems = [
    {
      emoji: "🎭",
      title: "Two hats, one head",
      description: "You're CEO during the day and CFO for your household at night. Both need tracking, both feel overwhelming.",
    },
    {
      emoji: "💳",
      title: "Everything's mixed",
      description: "Business receipts in your personal wallet. Household expenses on the business card. It's chaos.",
    },
    {
      emoji: "🧮",
      title: "Double the calculations",
      description: "Payroll for staff AND household budgets? You need two apps—or one very patient spreadsheet.",
    },
    {
      emoji: "😴",
      title: "No time, no energy",
      description: "By the time the kids are asleep, you're too tired to reconcile expenses. So they pile up.",
    },
  ];

  const showcaseItems = [
    {
      icon: Home,
      title: "Complete Family Tracking",
      description: "Multi-family expense management, per-member tracking, and budget building. Everything your household needs.",
    },
    {
      icon: Calculator,
      title: "🇹🇹 NIS Payroll Calculator",
      description: "Calculate employee and employer NIS contributions automatically. Stay compliant without the headache.",
      badge: "T&T Only",
    },
    {
      icon: Camera,
      title: "Smart Receipt Scanning",
      description: "Snap business receipts OR grocery receipts. Our AI knows the difference and organizes accordingly.",
    },
    {
      icon: Users,
      title: "Shift-Based Payroll",
      description: "Track employees with multiple shift types. Day rates, night rates, hourly—all handled.",
    },
    {
      icon: PiggyBank,
      title: "Budget Builder",
      description: "Use 50/30/20 or custom rules. See your personal AND business financial health at a glance.",
    },
    {
      icon: FileText,
      title: "Separate Reports",
      description: "Generate reports for your accountant (business) and reports for yourself (personal). Clean separation.",
    },
  ];

  const valueItems = [
    { feature: "25GB Secure Storage", value: "TT$100/mo" },
    { feature: "Everything in Staying Organized", value: "TT$149/mo" },
    { feature: "🇹🇹 NIS Payroll Calculator", value: "TT$80/mo" },
    { feature: "Employee Shift Tracking", value: "TT$60/mo" },
    { feature: "Quick Pay Entry", value: "TT$50/mo" },
    { feature: "Priority Support", value: "TT$30/mo" },
  ];

  const testimonials = [
    {
      quote: "I run a catering business and manage my mom's care. Nuacha handles both without any overlap or confusion.",
      author: "Candice W.",
      role: "Entrepreneur & Caregiver",
    },
    {
      quote: "Tax time used to be a nightmare. Now I just export my business expenses and my accountant is happy.",
      author: "Jason M.",
      role: "Freelance Consultant",
    },
    {
      quote: "Finally, one app that gets it. I don't have to choose between tracking my business or my family—I can do both.",
      author: "Renée A.",
      role: "Shop Owner & Mom",
    },
  ];

  const faqs = [
    {
      question: "How do I keep business and personal expenses separate?",
      answer: "You create separate 'families' in Nuacha—one for your business, one (or more) for your household(s). Each has its own dashboard, categories, and reports. They never mix unless you want them to.",
    },
    {
      question: "Do I really get everything from both plans?",
      answer: "Yes! The Fully Streamlined plan includes ALL features from both household and business tracking. Multi-family tracking, receipt scanning, NIS calculator, payroll management—everything.",
    },
    {
      question: "Can I see a combined view of all my finances?",
      answer: "Yes. While each 'family' (business or household) is tracked separately, you can view a unified dashboard that shows your complete financial picture across all entities.",
    },
    {
      question: "What if I have staff at home AND at my business?",
      answer: "No problem! You can track household help (like caregivers) separately from business employees. Each gets their own payroll tracking, NIS calculations, and expense records.",
    },
    {
      question: "Is this worth the extra cost over a single plan?",
      answer: "If you're managing both a business and a household, absolutely. You'd otherwise need two separate systems or spend hours reconciling. The Fully Streamlined plan saves you time, stress, and likely money in the long run.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      <PainPointHero
        headline="You run a business. You run a household. You're exhausted."
        subheadline="Juggling groceries, school fees, payroll, AND NIS calculations? There's one tool for all of it."
      />
      
      <AgitationSection 
        headline="Sound like your daily reality?"
        items={agitationItems} 
      />
      
      <SolutionBridge
        headline="One app for your whole life"
        subheadline="Nuacha gives you everything you need to manage business AND family finances—separately tracked, easily accessible, always organized."
        features={["All-in-One", "Clean Separation", "Complete Picture"]}
      />
      
      <ProductShowcase items={showcaseItems} />
      
      <ValueStackPricing
        items={valueItems}
        totalValue="TT$469/month"
        actualPriceTTD="TT$349"
        actualPriceUSD="~US$51.32"
        storageTier="25GB storage included"
        badge="Fully Streamlined - Best Value"
        ctaText="Get Everything Now"
        planType="fully_streamlined"
      />
      
      <TestimonialsSection
        testimonials={testimonials}
        headline="Built for people who do it all"
      />
      
      <FAQSection faqs={faqs} />
      
      <FinalCTA
        headline="Ready to simplify your entire financial life?"
        subheadline="Business, family, everything—finally in one place."
        ctaText="Start Now"
        planType="fully_streamlined"
        benefits={[
          "All family features",
          "All business features", 
          "Best value per feature",
        ]}
      />
    </div>
  );
};

export default GetStartedEntrepreneurs;
