import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, ChevronLeft, Download, Heart, Users, MapPin, Loader2, FileText } from 'lucide-react';
import { getCategoriesByGroup, DemoCategory } from '@/data/comprehensiveCategories';
import { formatTTD } from '@/utils/budgetUtils';
import { useSAHMBudgetSubmission } from '@/hooks/useSAHMBudgetSubmission';
import { toast } from 'sonner';
import { useBudgetPreview } from '@/context/BudgetPreviewContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBudgetTemplates } from '@/hooks/useBudgetTemplates';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useExpense } from '@/context/ExpenseContext';

interface BudgetData {
  aboutYou: {
    name: string;
    location: string;
    householdSize: number;
    dependents: number;
    email: string;
  };
  income: {
    primaryIncome: { amount: number; frequency: string; source: string; };
    secondaryIncome: { amount: number; frequency: string; source: string; };
    otherIncome: { amount: number; frequency: string; source: string; };
  };
  needs: Record<string, number>;
  wants: Record<string, number>;
  savings: Record<string, number>;
  notes: string;
}

interface CategoryInputProps {
  category: DemoCategory;
  value: number;
  onChange: (value: number) => void;
}

const CategoryInput: React.FC<CategoryInputProps> = ({ category, value, onChange }) => {
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

  return (
    <div className="space-y-2">
      <Label htmlFor={category.id} className="text-sm font-medium">
        {category.name}
      </Label>
      <p className="text-xs text-muted-foreground">
        {getSAHMExample(category.name)}
      </p>
      <div className="flex items-center space-x-2">
        <span className="text-sm">$</span>
        <Input
          id={category.id}
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default function SAHMBudgetBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { selectedFamily } = useExpense();
  const { submitBudget, isSubmitting } = useSAHMBudgetSubmission();
  const { createTemplate, updateTemplate, templates, isLoading: templatesLoading } = useBudgetTemplates(selectedFamily?.id);
  const { setPreviewData } = useBudgetPreview();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Template selection and lead capture state
  const [selectedTemplate, setSelectedTemplate] = useState('single-mom');
  const [templateRequestData, setTemplateRequestData] = useState({
    familySituation: '',
    description: '',
    challenges: ''
  });
  
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
      primaryIncome: { amount: 0, frequency: 'monthly', source: '' },
      secondaryIncome: { amount: 0, frequency: 'monthly', source: '' },
      otherIncome: { amount: 0, frequency: 'monthly', source: '' }
    },
    needs: {},
    wants: {},
    savings: {},
    notes: ''
  });

  // Load existing template data when in edit mode
  useEffect(() => {
    console.log('SAHMBudgetBuilder - Edit mode check:', { isEditMode, templateId, templatesLength: templates.length });
    
    if (isEditMode && templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      console.log('SAHMBudgetBuilder - Found template:', template);
      
      if (template && template.template_data) {
        setIsLoading(true);
        try {
          const templateData = template.template_data;
          console.log('SAHMBudgetBuilder - Loading template data:', templateData);
          
          // Pre-populate form with existing data
          setBudgetData({
            aboutYou: {
              name: templateData.aboutYou?.name || '',
              location: templateData.aboutYou?.location || '',
              householdSize: templateData.aboutYou?.household_size || 2,
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
            notes: templateData.notes || ''
          });
          
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
    'garden-services-essential', 'yard'
  ];

  // Priority wants categories for SAHM lifestyle - comprehensive lifestyle options
  const sahmPriorityWants = [
    'dining-out', 'skincare', 'makeup-cosmetics', 'haircuts-grooming', 'nail-care', 'spa-massage', 
    'gym-membership', 'cable-streaming', 'subscriptions', 'events-tickets', 'hobbies-crafts',
    'extracurricular', 'child-toys', 'birthday-gifts', 'holiday-gifts', 'activities-tours', 'gaming'
  ];
  
  const needsCategories = getCategoriesByGroup('needs').filter(cat => 
    sahmPriorityNeeds.includes(cat.id)
  ).concat([
    // Add Employee NIS as a new category
    { id: 'employee-nis', name: 'Employee NIS Contributions', color: '#EF4444', group: 'needs' as const }
  ]);
  
  const wantsCategories = getCategoriesByGroup('wants').filter(cat => 
    sahmPriorityWants.includes(cat.id)
  );
  const savingsCategories = getCategoriesByGroup('savings').slice(0, 4);

  const steps = [
    { title: 'About You', description: 'Tell us about your household' },
    { title: 'Income', description: 'Your household income sources' },
    { title: 'Needs', description: 'Essential monthly expenses' },
    { title: 'Wants', description: 'Lifestyle and discretionary spending' },
    { title: 'Savings', description: 'Future planning and goals' },
    { title: 'Review', description: 'Your personalized budget' }
  ];

  const getTotalByCategory = (category: 'needs' | 'wants' | 'savings'): number => {
    const categoryData = budgetData[category];
    return Object.values(categoryData).reduce((sum, value) => sum + value, 0);
  };

  const getTotalBudget = (): number => {
    return getTotalByCategory('needs') + getTotalByCategory('wants') + getTotalByCategory('savings');
  };

  const updateAboutYou = (field: keyof BudgetData['aboutYou'], value: string | number) => {
    setBudgetData(prev => ({
      ...prev,
      aboutYou: { ...prev.aboutYou, [field]: value }
    }));
  };

  const updateIncome = (type: keyof BudgetData['income'], field: string, value: string | number) => {
    setBudgetData(prev => ({
      ...prev,
      income: { 
        ...prev.income, 
        [type]: { ...prev.income[type], [field]: value }
      }
    }));
  };

  const updateCategory = (category: 'needs' | 'wants' | 'savings', categoryId: string, value: number) => {
    setBudgetData(prev => ({
      ...prev,
      [category]: { ...prev[category], [categoryId]: value }
    }));
  };

  const handleNext = () => {
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
    try {
      const leadData = {
        email: budgetData.aboutYou.email,
        name: budgetData.aboutYou.name || 'Anonymous',
        interest_type: 'budget_template_request',
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

      const response = await fetch('/api/demo-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      if (response.ok) {
        toast.success("Template request received! We'll notify you when it's ready.");
      }
    } catch (error) {
      console.error('Failed to submit template request:', error);
      // Don't block the flow if lead capture fails
    }
  };

  const handleDownload = async () => {
    if (!budgetData.aboutYou.email) {
      toast.error("Email required", {
        description: "Please provide your email to receive the budget template.",
      });
      return;
    }

    // Submit template request if user selected "Request New Template"
    if (selectedTemplate === 'request-new' && templateRequestData.familySituation) {
      await submitTemplateRequest();
    }

    try {
      if (user && selectedFamily) {
        // For authenticated users, save as budget template
        const totalIncome = Object.values(budgetData.income).reduce((sum, income) => {
          const frequency = income.frequency;
          const amount = income.amount;
          if (frequency === 'weekly') return sum + (amount * 52 / 12);
          if (frequency === 'yearly') return sum + (amount / 12);
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
          aboutYou: budgetData.aboutYou,
          income: transformedIncome,
          needs: budgetData.needs,
          wants: budgetData.wants,
          savings: budgetData.savings,
          notes: budgetData.notes,
        };
        
        if (isEditMode && templateId) {
          // Update existing template
          await updateTemplate(templateId, {
            name: `Budget Template - ${new Date().toLocaleDateString()}`,
            description: 'Updated using Budget Builder',
            total_monthly_income: totalIncome,
            template_data: templateData,
          });
          toast.success("Budget template updated! Redirecting to your dashboard...");
        } else {
          // Create new template
          await createTemplate({
            name: `Budget Template - ${new Date().toLocaleDateString()}`,
            description: 'Created using Budget Builder',
            total_monthly_income: totalIncome,
            template_data: templateData,
            is_default: true,
          });
          toast.success("Budget template created! Redirecting to your dashboard...");
        }
        
        navigate('/budget?tab=dashboard');
      } else if (user && !selectedFamily) {
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
      case 0: // About You
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="h-8 w-8 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Welcome, amazing mom! 💕</h3>
              <p className="text-muted-foreground">
                Let's create a budget that actually works for your real life. 
                Your info helps us personalize the template just for you.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Your name (optional)</Label>
                <Input
                  placeholder="First name"
                  value={budgetData.aboutYou.name}
                  onChange={(e) => updateAboutYou('name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email for budget template</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={budgetData.aboutYou.email}
                  onChange={(e) => updateAboutYou('email', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location (optional)
                </Label>
                <Input
                  id="location"
                  placeholder="City, State"
                  value={budgetData.aboutYou.location}
                  onChange={(e) => updateAboutYou('location', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="household">
                  <Users className="h-4 w-4 inline mr-1" />
                  Total household size
                </Label>
                <Input
                  id="household"
                  type="number"
                  min="1"
                  value={budgetData.aboutYou.householdSize}
                  onChange={(e) => updateAboutYou('householdSize', parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label>Number of dependents (kids, elderly parents, etc.)</Label>
                <Input
                  type="number"
                  min="0"
                  value={budgetData.aboutYou.dependents}
                   onChange={(e) => updateAboutYou('dependents', parseInt(e.target.value) || 0)}
                 />
               </div>
             </div>

             {/* Template Selection Section */}
             <div className="border-t pt-6 space-y-4">
               <div className="text-center space-y-2">
                 <FileText className="h-6 w-6 text-primary mx-auto" />
                 <h4 className="font-medium">Choose Your Budget Template</h4>
                 <p className="text-sm text-muted-foreground">
                   We're working on more templates! Help us build the perfect one for your family.
                 </p>
               </div>
               
               <div className="space-y-2">
                 <Label>Budget Template</Label>
                 <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select a template" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="single-mom">Single Mom Template</SelectItem>
                     <SelectItem value="request-new">Request New Template</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               {selectedTemplate === 'request-new' && (
                 <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                   <div className="text-center space-y-1">
                     <p className="text-sm font-medium text-primary">Tell us about your family situation</p>
                     <p className="text-xs text-muted-foreground">Stay tuned - new templates rolling out soon!</p>
                   </div>
                   
                   <div className="space-y-3">
                     <div className="space-y-2">
                       <Label>Family situation</Label>
                       <Select value={templateRequestData.familySituation} onValueChange={(value) => 
                         setTemplateRequestData(prev => ({ ...prev, familySituation: value }))
                       }>
                         <SelectTrigger>
                           <SelectValue placeholder="Select your family type" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="single-dad">Single Dad</SelectItem>
                           <SelectItem value="couple-with-kids">Couple with Kids</SelectItem>
                           <SelectItem value="elderly-care">Family with Elderly Care</SelectItem>
                           <SelectItem value="special-needs">Family with Special Needs</SelectItem>
                           <SelectItem value="large-family">Large Family (5+ kids)</SelectItem>
                           <SelectItem value="blended-family">Blended Family</SelectItem>
                           <SelectItem value="multigenerational">Multigenerational Household</SelectItem>
                           <SelectItem value="other">Other</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="space-y-2">
                       <Label>What makes your situation unique?</Label>
                       <Textarea
                         placeholder="Brief description of your family's specific needs..."
                         value={templateRequestData.description}
                         onChange={(e) => setTemplateRequestData(prev => ({ ...prev, description: e.target.value }))}
                         rows={2}
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label>Biggest budgeting challenges (optional)</Label>
                       <Textarea
                         placeholder="What specific challenges do you face with budgeting?"
                         value={templateRequestData.challenges}
                         onChange={(e) => setTemplateRequestData(prev => ({ ...prev, challenges: e.target.value }))}
                         rows={2}
                       />
                     </div>
                   </div>
                   
                   <div className="text-center">
                     <p className="text-xs text-muted-foreground">
                       💡 We'll notify you when your requested template is ready!
                     </p>
                   </div>
                 </div>
               )}
             </div>           </div>
        );

      case 1: // Income
        return (
          <div className="space-y-6">
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
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={budgetData.income.primaryIncome.amount || ''}
                        onChange={(e) => updateIncome('primaryIncome', 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="5000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={budgetData.income.primaryIncome.frequency}
                      onChange={(e) => updateIncome('primaryIncome', 'frequency', e.target.value)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input
                      placeholder="Main job, business, etc."
                      value={budgetData.income.primaryIncome.source}
                      onChange={(e) => updateIncome('primaryIncome', 'source', e.target.value)}
                    />
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
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={budgetData.income.secondaryIncome.amount || ''}
                        onChange={(e) => updateIncome('secondaryIncome', 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={budgetData.income.secondaryIncome.frequency}
                      onChange={(e) => updateIncome('secondaryIncome', 'frequency', e.target.value)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input
                      placeholder="Partner job, side business"
                      value={budgetData.income.secondaryIncome.source}
                      onChange={(e) => updateIncome('secondaryIncome', 'source', e.target.value)}
                    />
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
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={budgetData.income.otherIncome.amount || ''}
                        onChange={(e) => updateIncome('otherIncome', 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={budgetData.income.otherIncome.frequency}
                      onChange={(e) => updateIncome('otherIncome', 'frequency', e.target.value)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input
                      placeholder="Child support, investments, freelance"
                      value={budgetData.income.otherIncome.source}
                      onChange={(e) => updateIncome('otherIncome', 'source', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Needs
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Essential Expenses 🏠</h3>
              <p className="text-muted-foreground">
                The must-haves that keep your family running. Don't worry about being perfect - 
                estimates are totally fine!
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {needsCategories.map(category => (
                <CategoryInput
                  key={category.id}
                  category={category}
                  value={budgetData.needs[category.id] || 0}
                  onChange={(value) => updateCategory('needs', category.id, value)}
                />
              ))}
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Monthly Needs:</span>
                <span className="text-lg font-bold">{formatTTD(getTotalByCategory('needs'))}</span>
              </div>
            </div>
          </div>
        );

      case 3: // Wants
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Lifestyle & Fun 🎉</h3>
              <p className="text-muted-foreground">
                The things that make life enjoyable - you deserve these too! 
                Even small amounts add up to big happiness.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wantsCategories.map(category => (
                <CategoryInput
                  key={category.id}
                  category={category}
                  value={budgetData.wants[category.id] || 0}
                  onChange={(value) => updateCategory('wants', category.id, value)}
                />
              ))}
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Monthly Wants:</span>
                <span className="text-lg font-bold">{formatTTD(getTotalByCategory('wants'))}</span>
              </div>
            </div>
          </div>
        );

      case 4: // Savings
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Future Goals 💚</h3>
              <p className="text-muted-foreground">
                Even $10 a month counts! Every mom needs an emergency fund and dreams for her family.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savingsCategories.map(category => (
                <CategoryInput
                  key={category.id}
                  category={category}
                  value={budgetData.savings[category.id] || 0}
                  onChange={(value) => updateCategory('savings', category.id, value)}
                />
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>Notes & Special Circumstances</Label>
              <Textarea
                placeholder="Anything else you'd like to share? Special expenses, seasonal needs, goals..."
                value={budgetData.notes}
                onChange={(e) => setBudgetData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Monthly Savings:</span>
                <span className="text-lg font-bold">{formatTTD(getTotalByCategory('savings'))}</span>
              </div>
            </div>
          </div>
        );

      case 5: // Review
        const totalNeeds = getTotalByCategory('needs');
        const totalWants = getTotalByCategory('wants');
        const totalSavings = getTotalByCategory('savings');
        const totalBudget = getTotalBudget();
        
        const needsPercentage = totalBudget > 0 ? (totalNeeds / totalBudget) * 100 : 0;
        const wantsPercentage = totalBudget > 0 ? (totalWants / totalBudget) * 100 : 0;
        const savingsPercentage = totalBudget > 0 ? (totalSavings / totalBudget) * 100 : 0;

        return (
          <div className="space-y-6">
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
                    {needsPercentage.toFixed(1)}% of total
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
                    {wantsPercentage.toFixed(1)}% of total
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
                    {savingsPercentage.toFixed(1)}% of total
                  </div>
                  <Progress value={savingsPercentage} className="mt-2" />
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-primary/5 p-6 rounded-lg space-y-4">
              <h4 className="font-semibold">Your Budget Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Monthly Budget:</span>
                  <span className="font-bold text-lg">{formatTTD(totalBudget)}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  For a household of {budgetData.aboutYou.householdSize} 
                  {budgetData.aboutYou.dependents > 0 && ` with ${budgetData.aboutYou.dependents} dependents`}
                  {budgetData.aboutYou.location && ` in ${budgetData.aboutYou.location}`}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={handleDownload} 
                size="lg" 
                className="w-full md:w-auto"
                disabled={!budgetData.aboutYou.email || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Your Budget...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {user ? 'Create Budget Template' : 'Get My Personalized Budget Template'}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Free download • No spam • Used to help other moms too
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <Progress value={((currentStep + 1) / steps.length) * 100} />
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
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < steps.length - 1 && (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}