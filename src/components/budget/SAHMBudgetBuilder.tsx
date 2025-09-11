import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Download, Heart, Users, MapPin, Loader2, FileText, Plus, Send } from "lucide-react";
import { getCategoriesByGroup, DemoCategory } from '@/data/comprehensiveCategories';
import { getUnpaidLaborForFamilyType, UnpaidLaborCategory } from '@/data/unpaidLaborCategories';
import { formatTTD } from '@/utils/budgetUtils';
import { useSAHMBudgetSubmission } from '@/hooks/useSAHMBudgetSubmission';
import { toast } from 'sonner';
import { useBudgetPreview } from '@/context/BudgetPreviewContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBudgetTemplates } from '@/hooks/useBudgetTemplates';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useExpense } from '@/context/ExpenseContext';
import { supabase } from '@/integrations/supabase/client';
import BudgetLeadCaptureModal from './BudgetLeadCaptureModal';

// Onboarding
import { useOnboarding as useOnboardingHook } from '@/hooks/useOnboarding';
import { OnboardingStep } from '@/services/OnboardingService';
interface BudgetData {
  aboutYou: {
    name: string;
    location: string;
    householdSize: number;
    dependents: number;
    email: string;
  };
  income: {
    primaryIncome: {
      amount: number;
      frequency: string;
      source: string;
    };
    secondaryIncome: {
      amount: number;
      frequency: string;
      source: string;
    };
    otherIncome: {
      amount: number;
      frequency: string;
      source: string;
    };
  };
  needs: Record<string, number>;
  wants: Record<string, number>;
  savings: Record<string, number>;
  unpaidLabor: Record<string, number>;
  customUnpaidLabor: Array<{ id: string; name: string; value: number }>;
  includeUnpaidLabor: boolean;
  notes: string;
}
interface CategoryInputProps {
  category: DemoCategory;
  value: number;
  onChange: (value: number) => void;
}
const CategoryInput: React.FC<CategoryInputProps> = ({
  category,
  value,
  onChange
}) => {
  const getSAHMExample = (categoryName: string): string => {
    const examples: Record<string, string> = {
      // Needs examples
      'Groceries': 'weekly grocery shopping for family',
      'Electricity': 'monthly electricity bill',
      'Childcare': 'daycare, babysitter, or after-school care',
      'Fuel': 'gas for school runs, appointments, errands',
      'Child clothing': 'growing kids need new clothes regularly',
      'School fees': 'tuition, supplies, activities',
      'Personal hygiene': 'basic toiletries for family',
      'Emergency expenses': 'unexpected costs that always come up',
      'Health insurance': 'medical coverage for the family',
      'Home insurance': 'property and contents insurance',
      'Pest control': 'monthly pest control service',
      'Employee NIS Contributions': 'NIS for domestic employees (helper, nanny)',
      'Medical supplies': 'medications, first aid, health items',
      'Household repairs': 'fixing things around the house',
      'Toiletries': 'soap, shampoo, toothpaste, etc.',
      'Annuity payments': 'monthly annuity or pension payments',
      'Garden services': 'essential yard maintenance and landscaping',
      'Yard': 'yard maintenance, lawn care, garden upkeep',
      // Wants examples - lifestyle & personal care
      'Dining out': 'family meals, date nights, treats for the kids',
      'Skincare': 'face creams, serums, skincare routine',
      'Makeup & cosmetics': 'makeup, beauty products, cosmetics',
      'Haircuts & grooming': 'salon visits, hair treatments, styling',
      'Nail care': 'manicures, pedicures, nail treatments',
      'Spa & massage': 'spa treatments, massages, wellness',
      'Gym membership': 'fitness membership, exercise classes',
      'Cable / Streaming services': 'Netflix, cable TV, streaming subscriptions',
      'Subscriptions': 'magazines, apps, online services',
      'Events & tickets': 'movies, concerts, family outings',
      'Hobbies & crafts': 'craft supplies, hobby materials, creative projects',
      'Extracurricular activities': 'kids\' sports, music, dance classes',
      'Toys & games': 'children\'s toys, games, entertainment',
      'Birthday gifts': 'family birthday presents and celebrations',
      'Holiday gifts': 'Christmas, holiday gifts and celebrations',
      'Activities & tours': 'family day trips, local adventures, staycations',
      'Gaming': 'video games, gaming accessories, entertainment',
      // Savings examples
      'Savings': 'emergency fund, kids\' future, family goals'
    };
    return examples[categoryName] || `monthly ${categoryName.toLowerCase()} expenses`;
  };
  return <div className="space-y-2">
      <Label htmlFor={category.id} className="text-sm font-medium">
        {category.name}
      </Label>
      <p className="text-xs text-muted-foreground">
        {getSAHMExample(category.name)}
      </p>
      <div className="flex items-center space-x-2">
        <span className="text-sm">$</span>
        <Input id={category.id} type="number" min="0" step="0.01" value={value || ''} onChange={e => onChange(parseFloat(e.target.value) || 0)} placeholder="0.00" className="flex-1" />
      </div>
    </div>;
};
export default function SAHMBudgetBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user
  } = useAuth();
  const {
    selectedFamily
  } = useExpense();
  const {
    submitBudget,
    isSubmitting
  } = useSAHMBudgetSubmission();
  const {
    createTemplate,
    updateTemplate,
    templates,
    isLoading: templatesLoading
  } = useBudgetTemplates(selectedFamily?.id);
  const {
    setPreviewData
  } = useBudgetPreview();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);

  // Template selection and lead capture state
  const [selectedTemplate, setSelectedTemplate] = useState('single-mom');
  const [templateRequestData, setTemplateRequestData] = useState({
    familySituation: '',
    description: '',
    challenges: '',
    whatsapp: ''
  });

  // Onboarding hooks for template selection
  const { nextStep: nextOnboardingStep, isCurrentStep: isTemplateSelectionStep, isCompleted: isTemplateSelectionCompleted } = useOnboardingHook({
    step: OnboardingStep.TEMPLATE_SELECTION,
    target: '[data-onboarding="template-dropdown"]',
    enabled: true, // Always enabled when this onboarding step is active
    dependencies: []
  });

  const { nextStep: completeOnboarding, isCurrentStep: isEncouragementStep } = useOnboardingHook({
    step: OnboardingStep.TEMPLATE_ENCOURAGEMENT,
    target: '[data-onboarding="template-selected"]',
    enabled: true, // Always enabled when this onboarding step is active
    dependencies: []
  });

  // Handle template selection and auto-advance onboarding
  const handleTemplateSelection = (template: string) => {
    setSelectedTemplate(template);
    
    // If we're in the template selection step, advance to encouragement
    if (isTemplateSelectionStep) {
      setTimeout(() => {
        nextOnboardingStep();
      }, 500); // Small delay to show selection was made
    }
  };

  // Auto-complete onboarding after showing encouragement
  useEffect(() => {
    if (isEncouragementStep && selectedTemplate) {
      const timer = setTimeout(() => {
        completeOnboarding();
        toast.success("Great choice! You're all set to build your budget.");
      }, 2000); // Show encouragement for 2 seconds then complete

      return () => clearTimeout(timer);
    }
  }, [isEncouragementStep, selectedTemplate, completeOnboarding]);

  // Check if we're in edit mode
  const mode = searchParams.get('mode');
  const templateId = searchParams.get('templateId');
  const isEditMode = mode === 'edit' && templateId;
  const isViewMode = mode === 'view' && templateId;
  const [budgetData, setBudgetData] = useState<BudgetData>({
    aboutYou: {
      name: '',
      location: '',
      householdSize: 2,
      dependents: 0,
      email: ''
    },
    income: {
      primaryIncome: {
        amount: 0,
        frequency: 'monthly',
        source: ''
      },
      secondaryIncome: {
        amount: 0,
        frequency: 'monthly',
        source: ''
      },
      otherIncome: {
        amount: 0,
        frequency: 'monthly',
        source: ''
      }
    },
    needs: {},
    wants: {},
    savings: {},
    unpaidLabor: {},
    customUnpaidLabor: [],
    includeUnpaidLabor: false,
    notes: ''
  });

  // Load existing template data when in edit mode
  useEffect(() => {
    console.log('SAHMBudgetBuilder - Edit mode check:', {
      isEditMode,
      templateId,
      templatesLength: templates.length
    });
    if (isEditMode && templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      console.log('SAHMBudgetBuilder - Found template:', template);
      if (template && template.template_data) {
        setIsLoading(true);
        try {
          const templateData = template.template_data;
          console.log('SAHMBudgetBuilder - Loading template data:', templateData);
          console.log('SAHMBudgetBuilder - includeUnpaidLabor from template:', templateData.includeUnpaidLabor);

          // Pre-populate form with existing data
          const newBudgetData = {
            aboutYou: {
              name: templateData.aboutYou?.name || '',
              location: templateData.aboutYou?.location || '',
              householdSize: templateData.aboutYou?.household_size || templateData.aboutYou?.householdSize || 2,
              dependents: templateData.aboutYou?.dependents || 0,
              email: templateData.aboutYou?.email || user?.email || ''
            },
            income: {
              primaryIncome: {
                amount: templateData.income?.primaryIncome || 0,
                frequency: 'monthly',
                source: 'Primary Income'
              },
              secondaryIncome: {
                amount: templateData.income?.secondaryIncome || 0,
                frequency: 'monthly',
                source: 'Secondary Income'
              },
              otherIncome: {
                amount: templateData.income?.otherIncome || 0,
                frequency: 'monthly',
                source: 'Other Income'
              }
            },
            needs: templateData.needs || {},
            wants: templateData.wants || {},
            savings: templateData.savings || {},
            unpaidLabor: templateData.unpaidLabor || {},
            customUnpaidLabor: [],
            includeUnpaidLabor: templateData.includeUnpaidLabor || false,
            notes: templateData.notes || ''
          };
          
          console.log('SAHMBudgetBuilder - Setting budget data with includeUnpaidLabor:', newBudgetData.includeUnpaidLabor);
          setBudgetData(newBudgetData);
          toast.success(`Loaded template: ${template.name}`);
        } catch (error) {
          console.error('Error loading template data:', error);
          toast.error('Failed to load template data');
        } finally {
          setIsLoading(false);
        }
      } else if (template && !template.template_data) {
        console.warn('SAHMBudgetBuilder - Template found but no template_data:', template);
        toast.error('Template data is corrupted or missing');
      } else {
        console.warn('SAHMBudgetBuilder - Template not found with ID:', templateId);
        toast.error('Template not found');
      }
    }
  }, [isEditMode, templateId, templates, user?.email]);

  // SAHM priority needs with comprehensive essential categories
  const sahmPriorityNeeds = [
  // Housing essentials
  'rent-mortgage', 'electricity', 'water-sewer', 'gas', 'internet-wifi',
  // Communication essentials  
  'mobile-phone', 'home-phone',
  // Transportation essentials
  'fuel', 'vehicle-loan', 'vehicle-insurance', 'vehicle-maintenance', 'public-transportation',
  // Health & safety essentials
  'health-insurance', 'life-insurance', 'dental-insurance', 'vision-care',
  // Financial obligations
  'loan-repayments', 'property-tax', 'student-loans', 'minimum-debt', 'annuity-payments',
  // Family & care essentials
  'childcare', 'groceries', 'school-fees', 'school-lunches', 'school-transportation', 'medical-supplies', 'special-dietary',
  // Household essentials
  'home-insurance', 'pest-control', 'household-repairs', 'emergency-expenses', 'toiletries', 'elderly-care',
  // Yard maintenance essentials
  'garden-services-essential', 'yard'];

  // Priority wants categories for SAHM lifestyle - comprehensive lifestyle options
  const sahmPriorityWants = ['dining-out', 'skincare', 'makeup-cosmetics', 'haircuts-grooming', 'nail-care', 'spa-massage', 'gym-membership', 'cable-streaming', 'subscriptions', 'events-tickets', 'hobbies-crafts', 'extracurricular', 'child-toys', 'birthday-gifts', 'holiday-gifts', 'activities-tours', 'gaming'];
  const needsCategories = getCategoriesByGroup('needs').filter(cat => sahmPriorityNeeds.includes(cat.id)).concat([
  // Add Employee NIS as a new category
  {
    id: 'employee-nis',
    name: 'Employee NIS Contributions',
    color: '#EF4444',
    group: 'needs' as const
  }]);
  const wantsCategories = getCategoriesByGroup('wants').filter(cat => sahmPriorityWants.includes(cat.id));
  const savingsCategories = getCategoriesByGroup('savings').slice(0, 4);
  const steps = [{
    title: 'About You',
    description: 'Tell us about your household'
  }, {
    title: 'Income',
    description: 'Your household income sources'
  }, {
    title: 'Needs',
    description: 'Essential monthly expenses'
  }, {
    title: 'Wants',
    description: 'Lifestyle and discretionary spending'
  }, {
    title: 'Savings',
    description: 'Future planning and goals'
  }, {
    title: 'Unpaid Labor',
    description: 'Value your care and household work'
  }, {
    title: 'Review',
    description: 'Your personalized budget'
  }];
  // Determine family type based on household composition
  const getFamilyType = (): string => {
    const { householdSize, dependents } = budgetData.aboutYou;
    
    // Single parent with children
    if (dependents > 0 && householdSize <= dependents + 1) {
      return 'single-mother';
    }
    
    // Two-parent household
    if (householdSize > dependents + 1) {
      return 'two-parent';
    }
    
    // Default to single-mother for consistency
    return 'single-mother';
  };

  const getTotalByCategory = (category: 'needs' | 'wants' | 'savings' | 'unpaidLabor'): number => {
    const categoryData = budgetData[category];
    
    // For unpaid labor, use default values when checkbox is checked but no values entered
    if (category === 'unpaidLabor' && budgetData.includeUnpaidLabor) {
      const familyType = getFamilyType();
      const unpaidLaborCats = getUnpaidLaborForFamilyType(familyType);
      return unpaidLaborCats.reduce((sum, cat) => {
        return sum + (budgetData.unpaidLabor[cat.id] ?? 0);
      }, 0);
    }
    
    return Object.values(categoryData).reduce((sum, value) => sum + value, 0);
  };
  const getTotalBudget = (): number => {
    const baseBudget = getTotalByCategory('needs') + getTotalByCategory('wants') + getTotalByCategory('savings');
    return budgetData.includeUnpaidLabor ? baseBudget + getTotalByCategory('unpaidLabor') : baseBudget;
  };
  const updateAboutYou = (field: keyof BudgetData['aboutYou'], value: string | number) => {
    setBudgetData(prev => ({
      ...prev,
      aboutYou: {
        ...prev.aboutYou,
        [field]: value
      }
    }));
  };
  const updateIncome = (type: keyof BudgetData['income'], field: string, value: string | number) => {
    setBudgetData(prev => ({
      ...prev,
      income: {
        ...prev.income,
        [type]: {
          ...prev.income[type],
          [field]: value
        }
      }
    }));
  };
  const updateCategory = (category: 'needs' | 'wants' | 'savings' | 'unpaidLabor', categoryId: string, value: number) => {
    setBudgetData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [categoryId]: value
      }
    }));
  };
  const handleNext = async () => {
    // Auto-save changes when in edit mode and navigating between steps
    if (isEditMode && templateId && user && selectedFamily) {
      try {
        const totalIncome = Object.values(budgetData.income).reduce((sum, income) => {
          const frequency = income.frequency;
          const amount = income.amount;
          if (frequency === 'weekly') return sum + amount * 52 / 12;
          if (frequency === 'yearly') return sum + amount / 12;
          return sum + amount; // monthly
        }, 0);

        const transformedIncome: Record<string, number> = {};
        Object.entries(budgetData.income).forEach(([key, income]) => {
          if (income.amount > 0) {
            let monthlyAmount = income.amount;
            if (income.frequency === 'weekly') monthlyAmount = income.amount * 52 / 12;
            if (income.frequency === 'yearly') monthlyAmount = income.amount / 12;
            transformedIncome[key] = monthlyAmount;
          }
        });

        const templateData = {
          aboutYou: {
            name: budgetData.aboutYou.name,
            email: budgetData.aboutYou.email,
            location: budgetData.aboutYou.location,
            household_size: budgetData.aboutYou.householdSize,
            dependents: budgetData.aboutYou.dependents
          },
          income: transformedIncome,
          needs: budgetData.needs,
          wants: budgetData.wants,
          savings: budgetData.savings,
          unpaidLabor: budgetData.unpaidLabor,
          includeUnpaidLabor: budgetData.includeUnpaidLabor,
          notes: budgetData.notes
        };

        await updateTemplate(templateId, {
          template_data: templateData,
          total_monthly_income: totalIncome,
        });
        
        console.log('Auto-saved template data on step navigation');
      } catch (error) {
        // Silent fail for auto-save to not interrupt user flow
        console.error('Auto-save failed:', error);
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const submitTemplateRequest = async () => {
    // Validate required fields
    if (!budgetData.aboutYou.email) {
      toast.error("Email required", {
        description: "Please provide your email to receive updates about your template request."
      });
      return false;
    }
    if (!templateRequestData.familySituation) {
      toast.error("Family situation required", {
        description: "Please select your family situation to help us create the right template."
      });
      return false;
    }
    try {
      const leadData = {
        email: budgetData.aboutYou.email,
        name: budgetData.aboutYou.name || 'Anonymous',
        interest_type: 'budget_template_request',
        whatsapp_number: templateRequestData.whatsapp || null,
        additional_info: JSON.stringify({
          family_situation: templateRequestData.familySituation,
          description: templateRequestData.description,
          challenges: templateRequestData.challenges,
          location: budgetData.aboutYou.location,
          household_size: budgetData.aboutYou.householdSize,
          dependents: budgetData.aboutYou.dependents
        }),
        source: 'budget_builder'
      };
      const {
        error
      } = await supabase.from('demo_leads').insert([leadData]);
      if (error) {
        console.error('Error submitting template request:', error);
        
        // Handle duplicate email error specifically
        if (error.code === '23505') {
          toast.info("Budget request already exists!", {
            description: "You already have a budget in the system. This request conflicts with existing data. Stay tuned for our upcoming subscription feature that will allow multiple Custom Templates!"
          });
          
          // Redirect to budget page after showing the message
          setTimeout(() => {
            navigate('/budget');
          }, 2500);
          
          return false;
        }
        
        // Handle other errors
        toast.error("Something went wrong", {
          description: "We couldn't submit your request right now. Please try again."
        });
        return false;
      }
      toast.success("Template request received!", {
        description: "We'll email you when your custom template is ready. Thanks for your patience!"
      });
      return true;
    } catch (error) {
      console.error('Failed to submit template request:', error);
      toast.error("Something went wrong", {
        description: "We couldn't submit your request right now. Please try again."
      });
      return false;
    }
  };
  const handleDownload = async () => {
    if (!budgetData.aboutYou.email) {
      toast.error("Email required", {
        description: "Please provide your email to receive the budget template."
      });
      return;
    }

    // Submit template request if user selected "Request New Template"
    if (selectedTemplate === 'request-new') {
      await submitTemplateRequest();
      return; // Exit early for template requests
    }
    try {
      if (user && selectedFamily) {
        // For authenticated users, save as budget template
        const totalIncome = Object.values(budgetData.income).reduce((sum, income) => {
          const frequency = income.frequency;
          const amount = income.amount;
          if (frequency === 'weekly') return sum + amount * 52 / 12;
          if (frequency === 'yearly') return sum + amount / 12;
          return sum + amount; // monthly
        }, 0);

        // Transform the income data to match the template format
        const transformedIncome: Record<string, number> = {};
        Object.entries(budgetData.income).forEach(([key, income]) => {
          if (income.amount > 0) {
            let monthlyAmount = income.amount;
            if (income.frequency === 'weekly') monthlyAmount = income.amount * 52 / 12;
            if (income.frequency === 'yearly') monthlyAmount = income.amount / 12;
            transformedIncome[key] = monthlyAmount;
          }
        });
        const templateData = {
          aboutYou: {
            name: budgetData.aboutYou.name,
            email: budgetData.aboutYou.email,
            location: budgetData.aboutYou.location,
            household_size: budgetData.aboutYou.householdSize,
            dependents: budgetData.aboutYou.dependents
          },
          income: transformedIncome,
          needs: budgetData.needs,
          wants: budgetData.wants,
          savings: budgetData.savings,
          unpaidLabor: budgetData.unpaidLabor,
          includeUnpaidLabor: budgetData.includeUnpaidLabor,
          notes: budgetData.notes
        };
        if (isEditMode && templateId) {
          // Update existing template
          await updateTemplate(templateId, {
            name: `Budget Template - ${new Date().toLocaleDateString()}`,
            description: 'Updated using Budget Builder',
            total_monthly_income: totalIncome,
            template_data: templateData
          });
          toast.success("Budget template updated! Redirecting to your dashboard...");
        } else {
          // Create new template
          await createTemplate({
            name: `Budget Template - ${new Date().toLocaleDateString()}`,
            description: 'Created using Budget Builder',
            total_monthly_income: totalIncome,
            template_data: templateData,
            is_default: true
          });
          toast.success("Budget template created! Redirecting to your dashboard...");
        }
        navigate('/budget?tab=dashboard');
      } else if (user && !selectedFamily && selectedTemplate !== 'request-new') {
        toast.error('Please select a family first');
      } else {
        // For demo users, submit to leads
        const success = await submitBudget(budgetData);
        if (success) {
          setPreviewData(budgetData);
          navigate('/demo/budget');
          setCurrentStep(5); // Ensure we're on the review step
        }
      }
    } catch (error) {
      console.error('Failed to process budget:', error);
      toast.error(isEditMode ? "Failed to update budget template" : "Failed to save budget template");
    }
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // About You
        return <div className="space-y-6">
            {/* Template Selection First */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Choose Your Budget Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Select value={selectedTemplate} onValueChange={handleTemplateSelection}>
                    <SelectTrigger data-onboarding="template-dropdown">
                      <SelectValue placeholder="Select a template type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-mom" data-onboarding="template-selected">Single Mom Template</SelectItem>
                      <SelectItem value="request-new">Request New Template</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Show encouragement message when template is selected and onboarding is active */}
                  {selectedTemplate && isEncouragementStep && (
                    <div data-onboarding="template-selected" className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in-0 slide-in-from-top-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">✨</span>
                        <p className="text-sm font-medium text-primary">Perfect choice! This template is designed specifically for your family situation.</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedTemplate === 'request-new' && <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium">Tell us about your family situation</h4>
                      <div className="space-y-2">
                        <Label>Family situation</Label>
                        <Select value={templateRequestData.familySituation} onValueChange={value => setTemplateRequestData(prev => ({
                      ...prev,
                      familySituation: value
                    }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your situation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single-parent-multiple-kids">Single parent with multiple children</SelectItem>
                            <SelectItem value="blended-family">Blended family</SelectItem>
                            <SelectItem value="multigenerational">Multi-generational household</SelectItem>
                            <SelectItem value="special-needs-child">Family with special needs child</SelectItem>
                            <SelectItem value="homeschooling">Homeschooling family</SelectItem>
                            <SelectItem value="other">Other situation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Describe your unique needs</Label>
                        <Textarea placeholder="What makes your budget situation unique? (e.g., specific expenses, income patterns, challenges)" value={templateRequestData.description} onChange={e => setTemplateRequestData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Main budgeting challenges</Label>
                        <Textarea placeholder="What are your biggest challenges with budgeting? What would help most?" value={templateRequestData.challenges} onChange={e => setTemplateRequestData(prev => ({
                      ...prev,
                      challenges: e.target.value
                    }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>WhatsApp number (optional)</Label>
                        <Input type="tel" placeholder="e.g., +1 868 123 4567" value={templateRequestData.whatsapp} onChange={e => setTemplateRequestData(prev => ({
                      ...prev,
                      whatsapp: e.target.value
                    }))} />
                        <p className="text-xs text-muted-foreground">
                          We may contact you via WhatsApp for quick updates about your template
                        </p>
                      </div>
                      
                      {/* Submit Template Request Button */}
                      <div className="pt-2">
                        
                        <p className="text-sm text-muted-foreground mt-2 text-center">We'll email or what's app you when your custom template is ready!</p>
                      </div>
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Welcome Card */}
            <div className="text-center space-y-2">
              <Heart className="h-8 w-8 text-primary mx-auto" />
              {selectedTemplate === 'single-mom' ? <>
                  <h3 className="text-lg font-semibold">Welcome, amazing mom! 💕</h3>
                  <p className="text-muted-foreground">
                    Let's create a budget that actually works for your real life.
                    Your info helps us personalize the template just for you.
                  </p>
                </> : <>
                  <h3 className="text-lg font-semibold">Let's build your perfect budget! 💫</h3>
                  <p className="text-muted-foreground">
                    We'll help you create a custom template that fits your unique family situation.
                    Your info helps us personalize the template just for you.
                  </p>
                </>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your name (optional)</Label>
                <Input placeholder="First name" value={budgetData.aboutYou.name} onChange={e => updateAboutYou('name', e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label>Email for budget template</Label>
                <Input type="email" placeholder="your@email.com" value={budgetData.aboutYou.email} onChange={e => updateAboutYou('email', e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location (optional)
                </Label>
                <Input id="location" placeholder="City, State" value={budgetData.aboutYou.location} onChange={e => updateAboutYou('location', e.target.value)} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="household">
                  <Users className="h-4 w-4 inline mr-1" />
                  Total household size
                </Label>
                <Input id="household" type="number" min="1" value={budgetData.aboutYou.householdSize} onChange={e => updateAboutYou('householdSize', parseInt(e.target.value) || 1)} />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label>Number of dependents (kids, elderly parents, etc.)</Label>
                <Input type="number" min="0" value={budgetData.aboutYou.dependents} onChange={e => updateAboutYou('dependents', parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>;
      case 1:
        // Income
        return <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Household Income 💰</h3>
              <p className="text-muted-foreground">
                Tell us about your family's income sources. This helps create a realistic budget.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Primary Income */}
              <div className="space-y-4">
                <h4 className="font-medium">Primary Household Income</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">$</span>
                      <Input type="number" min="0" step="0.01" value={budgetData.income.primaryIncome.amount || ''} onChange={e => updateIncome('primaryIncome', 'amount', parseFloat(e.target.value) || 0)} placeholder="5000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select className="w-full p-2 border rounded-md" value={budgetData.income.primaryIncome.frequency} onChange={e => updateIncome('primaryIncome', 'frequency', e.target.value)}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input placeholder="Main job, business, etc." value={budgetData.income.primaryIncome.source} onChange={e => updateIncome('primaryIncome', 'source', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Secondary Income */}
              <div className="space-y-4">
                <h4 className="font-medium">Partner/Secondary Income (optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">$</span>
                      <Input type="number" min="0" step="0.01" value={budgetData.income.secondaryIncome.amount || ''} onChange={e => updateIncome('secondaryIncome', 'amount', parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select className="w-full p-2 border rounded-md" value={budgetData.income.secondaryIncome.frequency} onChange={e => updateIncome('secondaryIncome', 'frequency', e.target.value)}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input placeholder="Partner job, side business" value={budgetData.income.secondaryIncome.source} onChange={e => updateIncome('secondaryIncome', 'source', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Other Income */}
              <div className="space-y-4">
                <h4 className="font-medium">Other Income (optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">$</span>
                      <Input type="number" min="0" step="0.01" value={budgetData.income.otherIncome.amount || ''} onChange={e => updateIncome('otherIncome', 'amount', parseFloat(e.target.value) || 0)} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select className="w-full p-2 border rounded-md" value={budgetData.income.otherIncome.frequency} onChange={e => updateIncome('otherIncome', 'frequency', e.target.value)}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input placeholder="Child support, investments, freelance" value={budgetData.income.otherIncome.source} onChange={e => updateIncome('otherIncome', 'source', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>;
      case 2:
        // Needs
        return <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Essential Expenses 🏠</h3>
              <p className="text-muted-foreground">
                The must-haves that keep your family running. Don't worry about being perfect - 
                estimates are totally fine!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {needsCategories.map(category => <CategoryInput key={category.id} category={category} value={budgetData.needs[category.id] || 0} onChange={value => updateCategory('needs', category.id, value)} />)}
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Monthly Needs:</span>
                <span className="text-lg font-bold">{formatTTD(getTotalByCategory('needs'))}</span>
              </div>
            </div>
          </div>;
      case 3:
        // Wants
        return <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Lifestyle & Fun 🎉</h3>
              <p className="text-muted-foreground">
                The things that make life enjoyable - you deserve these too! 
                Even small amounts add up to big happiness.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wantsCategories.map(category => <CategoryInput key={category.id} category={category} value={budgetData.wants[category.id] || 0} onChange={value => updateCategory('wants', category.id, value)} />)}
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Monthly Wants:</span>
                <span className="text-lg font-bold">{formatTTD(getTotalByCategory('wants'))}</span>
              </div>
            </div>
          </div>;
      case 4:
        // Savings
        return <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Future Goals 💚</h3>
              <p className="text-muted-foreground">
                Even $10 a month counts! Every mom needs an emergency fund and dreams for her family.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savingsCategories.map(category => <CategoryInput key={category.id} category={category} value={budgetData.savings[category.id] || 0} onChange={value => updateCategory('savings', category.id, value)} />)}
            </div>
            
            <div className="space-y-2">
              <Label>Notes & Special Circumstances</Label>
              <Textarea placeholder="Anything else you'd like to share? Special expenses, seasonal needs, goals..." value={budgetData.notes} onChange={e => setBudgetData(prev => ({
              ...prev,
              notes: e.target.value
            }))} rows={3} />
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Monthly Savings:</span>
                <span className="text-lg font-bold">{formatTTD(getTotalByCategory('savings'))}</span>
        </div>
      </div>
      
      <BudgetLeadCaptureModal 
        open={showLeadModal} 
        onOpenChange={setShowLeadModal} 
      />
    </div>;
      case 5:
        // Unpaid Labor
        const familyType = getFamilyType();
        const unpaidLaborCategories = getUnpaidLaborForFamilyType(familyType);
        return <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Value your care and household work</h3>
              <p className="text-muted-foreground">
                Your unpaid work has real economic value! Add these to see the full picture of your household's economy.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <input 
                      type="checkbox" 
                      id="includeUnpaidLabor"
                      checked={budgetData.includeUnpaidLabor}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        console.log('Checkbox changed:', checked, 'Current state:', budgetData.includeUnpaidLabor);
                        setBudgetData(prev => ({
                          ...prev, 
                          includeUnpaidLabor: checked
                        }));
                      }}
                      className="mt-1"
                    />
                  </div>
                <div className="flex-1">
                  <label htmlFor="includeUnpaidLabor" className="font-medium cursor-pointer">
                    Include unpaid labor valuation in my budget
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    This helps you see the total economic value you provide and ensures fair financial planning.
                  </p>
                </div>
              </div>
            </div>
            
            {budgetData.includeUnpaidLabor && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unpaidLaborCategories.map(category => (
                    <div key={category.id} className="space-y-2 p-4 border rounded-lg bg-white">
                      <Label className="text-sm font-medium">
                        {category.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {category.description}
                      </p>
                      {category.relatedExpenseCategory && (
                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <span className="mr-1">💰</span>
                          Related expense: {category.relatedExpenseCategory}
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">$</span>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          value={budgetData.unpaidLabor[category.id] ?? 0} 
                          onChange={e => updateCategory('unpaidLabor', category.id, parseFloat(e.target.value) || 0)} 
                          placeholder={category.defaultValue.toString()} 
                          className="flex-1" 
                        />
                      </div>
                    </div>
                  ))}
                 </div>
                 
                 {/* Custom Unpaid Labor Section */}
                 <div className="mt-6">
                   <Card className="p-4 border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer" 
                         onClick={() => setShowLeadModal(true)}>
                     <div className="text-center space-y-3">
                       <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary/10 rounded-full">
                         <Plus className="w-6 h-6 text-primary" />
                       </div>
                       <div>
                         <h3 className="font-medium text-foreground">Add Custom Unpaid Labor</h3>
                         <p className="text-sm text-muted-foreground mt-1">
                           Track custom categories like pet care, elderly care, or community work
                         </p>
                       </div>
                       <Badge variant="secondary" className="text-xs">
                         Subscription Required
                       </Badge>
                     </div>
                   </Card>
                   
                   {/* Display added custom categories */}
                   {budgetData.customUnpaidLabor.length > 0 && (
                     <div className="mt-4 space-y-2">
                       <h4 className="text-sm font-medium text-muted-foreground">Custom Categories:</h4>
                       {budgetData.customUnpaidLabor.map((category) => (
                         <div key={category.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                           <span className="font-medium">{category.name}</span>
                           <span className="text-sm text-muted-foreground">
                             ${category.value.toLocaleString()}
                           </span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
                 
                 <div className="bg-muted/50 p-4 rounded-lg">
                   <div className="flex justify-between items-center">
                     <span className="font-medium">Total Monthly Unpaid Labor Value:</span>
                     <span className="text-lg font-bold text-purple-600">{formatTTD(getTotalByCategory('unpaidLabor'))}</span>
                   </div>
                   <p className="text-xs text-muted-foreground mt-1">
                     This represents the economic value of your unpaid care and household work
                   </p>
                 </div>
               </>
             )}
           </div>;
      case 6:
        // Review
        const totalNeeds = getTotalByCategory('needs');
        const totalWants = getTotalByCategory('wants');
        const totalSavings = getTotalByCategory('savings');
        const totalUnpaidLabor = budgetData.includeUnpaidLabor ? getTotalByCategory('unpaidLabor') : 0;
        const totalBudget = getTotalBudget();
        const baseBudget = totalNeeds + totalWants + totalSavings;
        const needsPercentage = baseBudget > 0 ? totalNeeds / baseBudget * 100 : 0;
        const wantsPercentage = baseBudget > 0 ? totalWants / baseBudget * 100 : 0;
        const savingsPercentage = baseBudget > 0 ? totalSavings / baseBudget * 100 : 0;
        return <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Your Personalized Budget 🎯</h3>
              <p className="text-muted-foreground">
                Amazing work! Here's your family's budget breakdown. 
                We'll email you a detailed template you can use and modify.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-red-600">Needs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTTD(totalNeeds)}</div>
                  <div className="text-sm text-muted-foreground">
                    {needsPercentage.toFixed(1)}% of cash budget
                  </div>
                  <Progress value={needsPercentage} className="mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-yellow-600">Wants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTTD(totalWants)}</div>
                  <div className="text-sm text-muted-foreground">
                    {wantsPercentage.toFixed(1)}% of cash budget
                  </div>
                  <Progress value={wantsPercentage} className="mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-600">Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatTTD(totalSavings)}</div>
                  <div className="text-sm text-muted-foreground">
                    {savingsPercentage.toFixed(1)}% of cash budget
                  </div>
                  <Progress value={savingsPercentage} className="mt-2" />
                </CardContent>
              </Card>
            </div>
            
            {budgetData.includeUnpaidLabor && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-600 flex items-center">
                    🤝 Unpaid Labor Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{formatTTD(totalUnpaidLabor)}</div>
                  <div className="text-sm text-muted-foreground">
                    Economic value of your care work
                  </div>
                  <div className="text-xs text-purple-600 mt-2">
                    Total household economic value: {formatTTD(totalBudget)}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="bg-primary/5 p-6 rounded-lg space-y-4">
              <h4 className="font-semibold">Your Budget Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Cash Budget Total:</span>
                  <span className="font-bold text-lg">{formatTTD(baseBudget)}</span>
                </div>
                {budgetData.includeUnpaidLabor && (
                  <>
                    <div className="flex justify-between text-purple-600">
                      <span>+ Unpaid Labor Value:</span>
                      <span className="font-bold">{formatTTD(totalUnpaidLabor)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Total Economic Value:</span>
                      <span className="font-bold text-xl text-purple-600">{formatTTD(totalBudget)}</span>
                    </div>
                  </>
                )}
                <div className="text-sm text-muted-foreground">
                  For a household of {budgetData.aboutYou.householdSize} 
                  {budgetData.aboutYou.dependents > 0 && ` with ${budgetData.aboutYou.dependents} dependents`}
                  {budgetData.aboutYou.location && ` in ${budgetData.aboutYou.location}`}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button onClick={handleDownload} size="lg" className="w-full md:w-auto" disabled={!budgetData.aboutYou.email || isSubmitting}>
                  {isSubmitting ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating Template...' : 'Saving Your Budget...'}
                  </> : <>
                    <Download className="h-4 w-4 mr-2" />
                    {selectedTemplate === 'request-new' ? 'Submit Request' : 
                     user ? (isEditMode ? 'Update Budget Template' : 'Create Budget Template') : 
                     'Get My Personalized Budget Template'}
                  </>}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {selectedTemplate === 'request-new' ? "We'll email you when your custom template is ready!" : "Free download • No spam • Used to help other moms too"}
              </p>
            </div>
          </div>;
      default:
        return null;
    }
  };
  return <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round((currentStep + 1) / steps.length * 100)}% Complete</span>
        </div>
        <Progress value={(currentStep + 1) / steps.length * 100} />
      </div>

      {/* Step Title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
        <p className="text-muted-foreground">{steps[currentStep].description}</p>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < steps.length - 1 && <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>}
      </div>

      <BudgetLeadCaptureModal open={showLeadModal} onOpenChange={setShowLeadModal} />
    </div>;
}