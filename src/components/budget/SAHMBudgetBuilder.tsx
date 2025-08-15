import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft, Download, Heart, Users, MapPin } from 'lucide-react';
import { getCategoriesByGroup, DemoCategory } from '@/data/comprehensiveCategories';
import { formatTTD } from '@/utils/budgetUtils';
import { toast } from 'sonner';

interface BudgetData {
  aboutYou: {
    name: string;
    location: string;
    householdSize: number;
    dependents: number;
    email: string;
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
      'Groceries': 'weekly grocery shopping for family',
      'Electricity': 'monthly electricity bill',
      'Childcare': 'daycare, babysitter, or after-school care',
      'Fuel': 'gas for school runs, appointments, errands',
      'Child clothing': 'growing kids need new clothes regularly',
      'School fees': 'tuition, supplies, activities',
      'Personal hygiene': 'basic toiletries for family',
      'Dining out': 'family meals, treats for the kids',
      'Emergency expenses': 'unexpected costs that always come up',
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
  const [currentStep, setCurrentStep] = useState(0);
  const [budgetData, setBudgetData] = useState<BudgetData>({
    aboutYou: {
      name: '',
      location: '',
      householdSize: 2,
      dependents: 0,
      email: ''
    },
    needs: {},
    wants: {},
    savings: {},
    notes: ''
  });

  const needsCategories = getCategoriesByGroup('needs').slice(0, 12); // Focus on most relevant
  const wantsCategories = getCategoriesByGroup('wants').slice(0, 8);
  const savingsCategories = getCategoriesByGroup('savings').slice(0, 4);

  const steps = [
    { title: 'About You', description: 'Tell us about your household' },
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

  const handleDownload = () => {
    toast.success("Budget template generated!", {
      description: "Your personalized SAHM budget is ready. Check your email for the download link.",
    });
    
    // Here you would typically call an API to generate and email the template
    console.log('Budget data for template generation:', budgetData);
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
          </div>
        );

      case 1: // Needs
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

      case 2: // Wants
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

      case 3: // Savings
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

      case 4: // Review
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
                disabled={!budgetData.aboutYou.email}
              >
                <Download className="h-4 w-4 mr-2" />
                Get My Personalized Budget Template
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