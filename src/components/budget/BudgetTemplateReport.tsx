import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatTTD } from '@/utils/budgetUtils';
import { Info, Download, FileText, Users, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DemoTemplateData {
  id: string;
  name: string;
  created_at: string;
  budget_data: {
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
    totalBudget: number;
    totalMonthlyIncome: number;
  };
}

export default function BudgetTemplateReport() {
  const [templateData, setTemplateData] = useState<DemoTemplateData | null>(null);

  useEffect(() => {
    // Load demo template from localStorage
    const storedTemplate = localStorage.getItem('demo-budget-template');
    if (storedTemplate) {
      try {
        const parsed = JSON.parse(storedTemplate);
        setTemplateData(parsed);
      } catch (error) {
        console.error('Error parsing demo template:', error);
      }
    }
  }, []);

  if (!templateData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Budget Template Found</h3>
          <p className="text-muted-foreground mb-4">
            Create your personalized budget template using our SAHM Budget Builder.
          </p>
          <Button asChild>
            <Link to="/demo/budget?mode=builder">Build Your Budget</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { budget_data } = templateData;
  
  // Calculate totals and percentages
  const totalNeeds = Object.values(budget_data.needs).reduce((sum, val) => sum + val, 0);
  const totalWants = Object.values(budget_data.wants).reduce((sum, val) => sum + val, 0);
  const totalSavings = Object.values(budget_data.savings).reduce((sum, val) => sum + val, 0);
  const totalBudget = totalNeeds + totalWants + totalSavings;
  
  const needsPercentage = totalBudget ? (totalNeeds / totalBudget) * 100 : 0;
  const wantsPercentage = totalBudget ? (totalWants / totalBudget) * 100 : 0;
  const savingsPercentage = totalBudget ? (totalSavings / totalBudget) * 100 : 0;
  
  // 50/30/20 rule compliance
  const needsVariance = needsPercentage - 50;
  const wantsVariance = wantsPercentage - 30;
  const savingsVariance = savingsPercentage - 20;
  
  // Chart data
  const pieData = [
    { name: 'Needs', value: totalNeeds, color: 'hsl(var(--chart-1))' },
    { name: 'Wants', value: totalWants, color: 'hsl(var(--chart-2))' },
    { name: 'Savings', value: totalSavings, color: 'hsl(var(--chart-3))' }
  ];
  
  const barData = [
    { name: 'Needs', actual: needsPercentage, target: 50 },
    { name: 'Wants', actual: wantsPercentage, target: 30 },
    { name: 'Savings', actual: savingsPercentage, target: 20 }
  ];

  const surplus = budget_data.totalMonthlyIncome - totalBudget;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {templateData.name}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Household of {budget_data.aboutYou.householdSize}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {budget_data.aboutYou.location || 'Location not specified'}
                </div>
              </div>
            </div>
            <Badge variant="secondary">Demo Template</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{formatTTD(budget_data.totalMonthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">Total Monthly Income</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{formatTTD(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Total Budget</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatTTD(surplus)}
            </div>
            <p className="text-xs text-muted-foreground">
              {surplus >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.abs(needsVariance) < 5 && Math.abs(wantsVariance) < 5 && Math.abs(savingsVariance) < 5 ? '✅' : '⚠️'}
            </div>
            <p className="text-xs text-muted-foreground">50/30/20 Rule</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatTTD(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget vs 50/30/20 Rule */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs 50/30/20 Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                <Bar dataKey="actual" fill="hsl(var(--primary))" name="Your Budget" />
                <Bar dataKey="target" fill="hsl(var(--muted))" name="50/30/20 Target" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Needs ({needsPercentage.toFixed(1)}%)</CardTitle>
            <Progress value={needsPercentage} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(budget_data.needs).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span>{formatTTD(value)}</span>
              </div>
            ))}
            <div className="pt-2 border-t font-semibold flex justify-between">
              <span>Total Needs</span>
              <span>{formatTTD(totalNeeds)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Wants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Wants ({wantsPercentage.toFixed(1)}%)</CardTitle>
            <Progress value={wantsPercentage} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(budget_data.wants).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span>{formatTTD(value)}</span>
              </div>
            ))}
            <div className="pt-2 border-t font-semibold flex justify-between">
              <span>Total Wants</span>
              <span>{formatTTD(totalWants)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Savings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-700">Savings ({savingsPercentage.toFixed(1)}%)</CardTitle>
            <Progress value={savingsPercentage} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(budget_data.savings).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span>{formatTTD(value)}</span>
              </div>
            ))}
            <div className="pt-2 border-t font-semibold flex justify-between">
              <span>Total Savings</span>
              <span>{formatTTD(totalSavings)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 50/30/20 Rule Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>50/30/20 Budget Rule Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{needsPercentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Needs (Target: 50%)</div>
              <Badge variant={Math.abs(needsVariance) < 5 ? "default" : "destructive"}>
                {needsVariance >= 0 ? '+' : ''}{needsVariance.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{wantsPercentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Wants (Target: 30%)</div>
              <Badge variant={Math.abs(wantsVariance) < 5 ? "default" : "destructive"}>
                {wantsVariance >= 0 ? '+' : ''}{wantsVariance.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">{savingsPercentage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Savings (Target: 20%)</div>
              <Badge variant={Math.abs(savingsVariance) < 5 ? "default" : "destructive"}>
                {savingsVariance >= 0 ? '+' : ''}{savingsVariance.toFixed(1)}%
              </Badge>
            </div>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {Math.abs(needsVariance) < 5 && Math.abs(wantsVariance) < 5 && Math.abs(savingsVariance) < 5
                ? "🎉 Excellent! Your budget closely follows the 50/30/20 rule for balanced financial health."
                : "Consider adjusting your allocations to better align with the 50/30/20 rule for optimal financial balance."
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="border-primary">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Love your personalized budget?</h3>
          <p className="text-muted-foreground mb-4">
            Sign up now to save your template, track real expenses, and access advanced budgeting tools.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/demo/budget?mode=builder">Modify Budget</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}