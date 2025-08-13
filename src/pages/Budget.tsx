import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BudgetDashboard from '@/components/budget/BudgetDashboard';
import IncomeManager from '@/components/budget/IncomeManager';
import { ExpenseCategoriesManager } from '@/components/budget/ExpenseCategoriesManager';
import RulesManager from '@/components/budget/RulesManager';
import ScenarioPlanner from '@/components/budget/ScenarioPlanner';
import HowToUse from '@/components/budget/HowToUse';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function Budget() {
  const [activeTab, setActiveTab] = useState('dashboard');

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
          <h1 className="text-3xl font-bold tracking-tight">Budget & Planning Pro</h1>
          <p className="text-muted-foreground">
            Take control of your finances with intelligent budgeting and planning tools
          </p>
        </div>
      </div>

      {/* Main Content */}
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
          <BudgetDashboard />
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
      </Tabs>
    </div>
  );
}