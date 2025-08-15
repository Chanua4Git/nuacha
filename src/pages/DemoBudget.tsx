import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Eye, PenTool } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Demo components with mock data
import DemoBudgetDashboard from '@/components/budget/DemoBudgetDashboard';
import DemoIncomeManager from '@/components/budget/DemoIncomeManager';
import DemoExpenseManager from '@/components/budget/DemoExpenseManager';
import DemoRulesManager from '@/components/budget/DemoRulesManager';
import DemoScenarioPlanner from '@/components/budget/DemoScenarioPlanner';
import HowToUse from '@/components/budget/HowToUse';
import SAHMBudgetBuilder from '@/components/budget/SAHMBudgetBuilder';

export default function DemoBudget() {
  const [mode, setMode] = useState<'demo' | 'builder'>('demo');
  const [activeTab, setActiveTab] = useState('dashboard');

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
              ? "This is a demo of our Budget & Planning Pro module. In the full app, this connects to your actual income and expense data."
              : "Create your personalized SAHM budget template. We'll help you build a realistic budget that actually works for your family."
            }
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === 'demo' ? 'Budget & Planning Pro Demo' : 'Build Your Personal SAHM Budget'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'demo' 
              ? "Experience intelligent budgeting with the 50/30/20 rule and scenario planning"
              : "A personalized, step-by-step budget builder designed specifically for stay-at-home moms"
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      {mode === 'demo' ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="help">How to Use</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DemoBudgetDashboard />
          </TabsContent>

          <TabsContent value="income" className="space-y-6">
            <DemoIncomeManager />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <DemoExpenseManager />
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <DemoRulesManager />
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-6">
            <DemoScenarioPlanner />
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <HowToUse />
          </TabsContent>
        </Tabs>
      ) : (
        <SAHMBudgetBuilder />
      )}

      {/* CTA Section - Only show in demo mode */}
      {mode === 'demo' && (
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to take control of your finances?</h3>
            <p className="text-muted-foreground mb-4">
              Sign up now to connect your real income and expenses for personalized budget planning.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/signup">Start Free Trial</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/options">View All Solutions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}