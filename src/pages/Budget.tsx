import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, Heart, ArrowRight } from 'lucide-react';
import BudgetDashboard from '@/components/budget/BudgetDashboard';
import IncomeManager from '@/components/budget/IncomeManager';
import { ExpenseCategoriesManager } from '@/components/budget/ExpenseCategoriesManager';
import RulesManager from '@/components/budget/RulesManager';
import ScenarioPlanner from '@/components/budget/ScenarioPlanner';
import HowToUse from '@/components/budget/HowToUse';
import SAHMBudgetBuilder from '@/components/budget/SAHMBudgetBuilder';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useAuth } from '@/auth/contexts/AuthProvider';

export default function Budget() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user ? 'dashboard' : 'build-budget');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/app">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Budget & Planning Pro</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {user ? 'Budget & Planning Pro' : 'Build Your SAHM Budget'}
          </h1>
          <p className="text-muted-foreground">
            {user 
              ? 'Take control of your finances with intelligent budgeting and planning tools'
              : 'Create a realistic, mom-tested budget template that truly reflects your monthly expenses'
            }
          </p>
        </div>
      </div>

      {/* Demo Alert for Non-Authenticated Users */}
      {!user && (
        <Alert className="border-primary/20 bg-primary/5">
          <Heart className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Hey mama! 💕 This budget builder is designed by moms, for moms. 
              Your info helps us create better templates for all of us.
            </span>
            <Button variant="outline" size="sm" asChild>
              <a href="/signup">
                <ArrowRight className="h-4 w-4 mr-1" />
                Sign up for full features
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {user ? (
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="builder">Budget Builder</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="help">How to Use</TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build-budget">Build Your Budget</TabsTrigger>
            <TabsTrigger value="help">How It Works</TabsTrigger>
          </TabsList>
        )}

        {/* Authenticated User Content */}
        {user && (
          <>
            <TabsContent value="dashboard" className="space-y-6">
              <BudgetDashboard />
            </TabsContent>

            <TabsContent value="builder" className="space-y-6">
              <SAHMBudgetBuilder />
            </TabsContent>

            <TabsContent value="income" className="space-y-6">
              <IncomeManager />
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6">
              <ExpenseCategoriesManager />
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <RulesManager />
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-6">
              <ScenarioPlanner />
            </TabsContent>

            <TabsContent value="help" className="space-y-6">
              <HowToUse />
            </TabsContent>
          </>
        )}

        {/* Demo User Content */}
        {!user && (
          <>
            <TabsContent value="build-budget" className="space-y-6">
              <SAHMBudgetBuilder />
            </TabsContent>

            <TabsContent value="help" className="space-y-6">
              <HowToUse />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}