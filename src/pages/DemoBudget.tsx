import BudgetTemplateReport from '@/components/budget/BudgetTemplateReport';
import React, { useMemo, useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Eye, PenTool } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBudgetPreview } from '@/context/BudgetPreviewContext';
import { getCategoriesByGroup } from '@/data/comprehensiveCategories';
import { BudgetSummary, FrequencyType } from '@/types/budget';

// Full components with demo context
import { DemoBudgetProvider } from '@/context/DemoBudgetContext';
import DemoAwareBudgetDashboard from '@/components/budget/DemoAwareBudgetDashboard';
import DemoAwareIncomeManager from '@/components/budget/DemoAwareIncomeManager';
import DemoExpenseManager from '@/components/budget/DemoExpenseManager';
import DemoAwareRulesManager from '@/components/budget/DemoAwareRulesManager';
import DemoScenarioPlanner from '@/components/budget/DemoScenarioPlanner';
import HowToUse from '@/components/budget/HowToUse';
import SAHMBudgetBuilder from '@/components/budget/SAHMBudgetBuilder';

export default function DemoBudget() {
  const [mode, setMode] = useState<'demo' | 'builder'>('demo');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchParams] = useSearchParams();
  const { previewData } = useBudgetPreview();
  const isMobile = useIsMobile();

  // Handle URL parameters for deep linking
  useEffect(() => {
    const tab = searchParams.get('tab');
    const viewMode = searchParams.get('view');
    const templateId = searchParams.get('templateId');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    if (templateId === 'demo-generated') {
      setMode('demo');
      setActiveTab('templates');
    }
  }, [searchParams]);

  const incomeSourcesOverride = useMemo(() => {
    if (!previewData) return undefined;
    const toMonthly = (amount: number, freq: string) => {
      switch (freq) {
        case 'weekly': return amount * 4.33;
        case 'yearly': return amount / 12;
        default: return amount;
      }
    };
    const items = [
      { id: 'primary', name: previewData.income.primaryIncome.source || 'Primary Income', frequency: 'monthly' as FrequencyType, amount_ttd: toMonthly(previewData.income.primaryIncome.amount, previewData.income.primaryIncome.frequency), notes: '' },
      { id: 'secondary', name: previewData.income.secondaryIncome.source || 'Secondary Income', frequency: 'monthly' as FrequencyType, amount_ttd: toMonthly(previewData.income.secondaryIncome.amount, previewData.income.secondaryIncome.frequency), notes: '' },
      { id: 'other', name: previewData.income.otherIncome.source || 'Other Income', frequency: 'monthly' as FrequencyType, amount_ttd: toMonthly(previewData.income.otherIncome.amount, previewData.income.otherIncome.frequency), notes: '' }
    ];
    return items.filter(i => i.amount_ttd > 0);
  }, [previewData]);

  const categoriesByGroupOverride = useMemo(() => {
    if (!previewData) return undefined as any;
    const today = new Date().toISOString().slice(0,10);
    const mapGroup = (group: 'needs' | 'wants' | 'savings') => {
      const groupCats = getCategoriesByGroup(group);
      return Object.entries(previewData[group]).map(([id, amount]) => {
        const found = groupCats.find(c => c.id === id);
        const name = found?.name || id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return {
          id,
          name,
          expenses: [{ amount, description: 'Planned monthly budget', date: today }],
          monthlyTotal: amount
        };
      });
    };
    return { needs: mapGroup('needs'), wants: mapGroup('wants'), savings: mapGroup('savings') };
  }, [previewData]);

  const summaryOverride = useMemo(() => {
    if (!previewData) return undefined as BudgetSummary | undefined;
    const toMonthly = (amount: number, freq: string) => {
      switch (freq) {
        case 'weekly': return amount * 4.33;
        case 'yearly': return amount / 12;
        default: return amount;
      }
    };
    const totalIncome = toMonthly(previewData.income.primaryIncome.amount, previewData.income.primaryIncome.frequency)
      + toMonthly(previewData.income.secondaryIncome.amount, previewData.income.secondaryIncome.frequency)
      + toMonthly(previewData.income.otherIncome.amount, previewData.income.otherIncome.frequency);
    const needs = Object.values(previewData.needs).reduce((a,b)=>a+b,0);
    const wants = Object.values(previewData.wants).reduce((a,b)=>a+b,0);
    const savings = Object.values(previewData.savings).reduce((a,b)=>a+b,0);
    const totalExpenses = needs + wants + savings;
    const byGroup = {
      needs: { total: needs, percentage: totalExpenses ? (needs/totalExpenses)*100 : 0 },
      wants: { total: wants, percentage: totalExpenses ? (wants/totalExpenses)*100 : 0 },
      savings: { total: savings, percentage: totalExpenses ? (savings/totalExpenses)*100 : 0 }
    };
    const ruleComparison = {
      needs: { actual: byGroup.needs.percentage, target: 50, variance: byGroup.needs.percentage - 50 },
      wants: { actual: byGroup.wants.percentage, target: 30, variance: byGroup.wants.percentage - 30 },
      savings: { actual: byGroup.savings.percentage, target: 20, variance: byGroup.savings.percentage - 20 }
    };
    return { totalIncome, totalExpenses, surplus: totalIncome - totalExpenses, byGroup, ruleComparison } as BudgetSummary;
  }, [previewData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/demo">Demo</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Budget & Planning Pro</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-muted p-1 rounded-lg inline-flex">
            <Button
              variant={mode === 'demo' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('demo')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Demo
            </Button>
            <Button
              variant={mode === 'builder' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('builder')}
              className="flex items-center gap-2"
            >
              <PenTool className="h-4 w-4" />
              Build Your Budget
            </Button>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {mode === 'demo' 
              ? "You're experiencing the complete Budget & Planning Pro module with full functionality. All features work exactly like the authenticated app - try adding income sources, creating budget rules, and exploring scenarios!"
              : "Create your personalized SAHM budget template. We'll help you build a realistic budget that actually works for your family."
            }
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'demo' ? 'Budget & Planning Pro - Full Experience' : 'Build Your Personal SAHM Budget'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'demo' 
              ? "Complete budget management with real-time calculations, custom rules, and scenario planning - exactly as you'd experience in the full app"
              : "A personalized, step-by-step budget builder designed specifically for stay-at-home moms"
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      {mode === 'demo' ? (
        <DemoBudgetProvider>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 h-auto py-2 mb-4">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
                {isMobile ? 'Dashboard' : 'Dashboard'}
              </TabsTrigger>
              <TabsTrigger value="income" className="text-xs sm:text-sm">
                {isMobile ? 'Income' : 'Income'}
              </TabsTrigger>
              <TabsTrigger value="expenses" className="text-xs sm:text-sm">
                {isMobile ? 'Expenses' : 'Expenses'}
              </TabsTrigger>
              <TabsTrigger value="rules" className="text-xs sm:text-sm">
                {isMobile ? 'Rules' : 'Rules'}
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs sm:text-sm">
                {isMobile ? 'Templates' : 'Templates'}
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="text-xs sm:text-sm">
                {isMobile ? 'Scenarios' : 'Scenarios'}
              </TabsTrigger>
              <TabsTrigger value="help" className="text-xs sm:text-sm">
                {isMobile ? 'Help' : 'How to Use'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <DemoAwareBudgetDashboard />
            </TabsContent>

            <TabsContent value="income" className="space-y-6">
              <DemoAwareIncomeManager />
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6">
              <DemoExpenseManager categoriesByGroupOverride={categoriesByGroupOverride} />
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <DemoAwareRulesManager />
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <BudgetTemplateReport />
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-6">
              <DemoScenarioPlanner />
            </TabsContent>

            <TabsContent value="help" className="space-y-6">
              <HowToUse />
            </TabsContent>
          </Tabs>
        </DemoBudgetProvider>
      ) : (
        <SAHMBudgetBuilder />
      )}

    </div>
  );
}