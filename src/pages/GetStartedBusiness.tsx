import { PainPointHero } from "@/components/sales/PainPointHero";
import { AgitationSection } from "@/components/sales/AgitationSection";
import { SolutionBridge } from "@/components/sales/SolutionBridge";
import { ProductShowcase } from "@/components/sales/ProductShowcase";
import { ValueStackPricing } from "@/components/sales/ValueStackPricing";
import { TestimonialsSection } from "@/components/sales/TestimonialsSection";
import { FAQSection } from "@/components/sales/FAQSection";
import { FinalCTA } from "@/components/sales/FinalCTA";
import { Calculator, Users, Clock, FileText, Receipt, DollarSign } from "lucide-react";

const GetStartedBusiness = () => {
  const agitationItems = [
    {
      emoji: "🧮",
      title: "NIS calculation headaches",
      description: "Figuring out employee and employer contributions every month shouldn't require a finance degree.",
    },
    {
      emoji: "⏰",
      title: "Shift tracking chaos",
      description: "Day shifts, night shifts, extended hours... keeping track of who worked what is exhausting.",
    },
    {
      emoji: "📋",
      title: "Compliance worries",
      description: "Are you calculating NIS correctly? The last thing you need is a surprise from the Board.",
    },
    {
      emoji: "💳",
      title: "Mixed expenses",
      description: "Business purchases on personal cards. Personal purchases for business. It's all a blur.",
    },
  ];

  const showcaseItems = [
    {
      icon: Calculator,
      title: "🇹🇹 NIS Payroll Calculator",
      description: "Automatically calculate employee and employer NIS contributions using the latest T&T rates. Always compliant.",
      badge: "T&T Only",
    },
    {
      icon: Users,
      title: "Shift-Based Employee Management",
      description: "Define multiple shift types per employee with different rates. Day, night, extended—all tracked separately.",
    },
    {
      icon: Clock,
      title: "Quick Pay Entry",
      description: "Record employee payments in seconds. Select the employee, pick the shift, and it's done. Expense created automatically.",
    },
    {
      icon: FileText,
      title: "Business Expense Reports",
      description: "Generate clean reports for your accountant. Filter by date, category, or payment method. Export to PDF or CSV.",
    },
  ];

  const valueItems = [
    { feature: "🇹🇹 NIS Payroll Calculator", value: "$15/mo" },
    { feature: "Shift-Based Employee Management", value: "$12/mo" },
    { feature: "Quick Pay Entry System", value: "$10/mo" },
    { feature: "Smart Receipt Scanning", value: "$9/mo" },
    { feature: "Financial Reports & Export", value: "$8/mo" },
    { feature: "Business Expense Tracking", value: "$7/mo" },
  ];

  const testimonials = [
    {
      quote: "The NIS calculator alone saves me hours every month. No more second-guessing my calculations.",
      author: "Marcus J.",
      role: "Restaurant Owner, San Fernando",
    },
    {
      quote: "I have staff on different shift rates. Nuacha handles it all. Just click and pay.",
      author: "Sherry-Ann P.",
      role: "Daycare Operator",
    },
    {
      quote: "My accountant loves me now. Reports are clean, organized, and exactly what she needs.",
      author: "Devon L.",
      role: "Contractor",
    },
  ];

  const faqs = [
    {
      question: "Are the NIS rates up to date?",
      answer: "Yes! We keep our NIS contribution tables current with the latest rates from the National Insurance Board of Trinidad & Tobago. When rates change, we update automatically.",
    },
    {
      question: "Can I track multiple employees with different shift rates?",
      answer: "Absolutely. You can create unlimited employees, each with their own shift configurations. One employee can even have multiple shift types (day shift at $280, night shift at $250, etc.).",
    },
    {
      question: "Does it generate payroll reports?",
      answer: "Yes. You can generate detailed payroll reports showing each employee's earnings, NIS contributions (employee and employer portions), and net pay. Perfect for your accountant.",
    },
    {
      question: "Can I separate business expenses from personal?",
      answer: "Yes! Create a separate 'family' for your business and another for personal expenses. They stay completely separate with their own categories and reports.",
    },
    {
      question: "Is this only for T&T businesses?",
      answer: "The NIS calculator is specifically designed for Trinidad & Tobago businesses. However, the expense tracking and general payroll features work for any small business.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      <PainPointHero
        headline="Running a business in T&T is hard enough."
        subheadline="Calculating NIS and managing payroll shouldn't add to the stress. There's an easier way."
      />
      
      <AgitationSection items={agitationItems} />
      
      <SolutionBridge
        headline="A local tool built for T&T businesses"
        subheadline="Nuacha understands the unique challenges of running a business in Trinidad & Tobago. NIS compliance, shift management, and expense tracking—all in one place."
        features={["🇹🇹 Made for T&T", "NIS Compliant", "Simple"]}
      />
      
      <ProductShowcase items={showcaseItems} />
      
      <ValueStackPricing
        items={valueItems}
        totalValue="$61/month"
        actualPrice="$14.99"
        badge="Business Plan - Early Adopter Pricing"
        planType="business"
      />
      
      <TestimonialsSection
        testimonials={testimonials}
        headline="Trusted by T&T businesses"
      />
      
      <FAQSection faqs={faqs} />
      
      <FinalCTA
        headline="Ready to simplify your business finances?"
        subheadline="Join T&T business owners who've found a better way."
        ctaText="Start Now"
        planType="business"
      />
    </div>
  );
};

export default GetStartedBusiness;
