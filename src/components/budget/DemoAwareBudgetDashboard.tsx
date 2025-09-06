import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDemoBudgetSummary } from '@/hooks/useDemoBudgetSummary';
import { formatTTD, getVarianceStatus } from '@/utils/budgetUtils';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Target, Heart, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function DemoAwareBudgetDashboard() {
  const [selectedMonth] = useState(new Date());
  const { summary, loading, error } = useDemoBudgetSummary();

  const navigateMonth = () => {
    // Demo mode - just show message
    return;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            {error || 'Unable to load budget summary. Please try again.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const pieData = [
    { name: 'Needs', value: summary.byGroup.needs.total, color: 'hsl(var(--chart-1))' },
    { name: 'Wants', value: summary.byGroup.wants.total, color: 'hsl(var(--chart-2))' },
    { name: 'Savings', value: summary.byGroup.savings.total, color: 'hsl(var(--chart-3))' }
  ];

  const barData = [
    {
      category: 'Needs',
      actual: summary.byGroup.needs.total,
      target: (summary.totalIncome * 0.5),
      percentage: summary.byGroup.needs.percentage
    },
    {
      category: 'Wants', 
      actual: summary.byGroup.wants.total,
      target: (summary.totalIncome * 0.3),
      percentage: summary.byGroup.wants.percentage
    },
    {
      category: 'Savings',
      actual: summary.byGroup.savings.total,
      target: (summary.totalIncome * 0.2),
      percentage: summary.byGroup.savings.percentage
    }
  ];

  return (
    <div className="space-y-6">
      {/* Demo Mode Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <Heart className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Demo Mode - Full Budget Dashboard Experience</strong>
          <br />
          You're seeing the complete budget dashboard with all features. In the full app, this connects to your real financial data and updates automatically.
        </AlertDescription>
      </Alert>

      {/* Period Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigateMonth} disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" size="icon" onClick={navigateMonth} disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Badge variant="secondary">Demo Data</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatTTD(summary.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Monthly income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTTD(summary.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All spending categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surplus</CardTitle>
            {summary.surplus >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatTTD(summary.surplus)}
            </div>
            <p className="text-xs text-muted-foreground">After all expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule Compliance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
          <div className="text-2xl font-bold">
            {Object.values(summary.ruleComparison).filter(r => getVarianceStatus(r.variance) === 'on-track').length}/3
          </div>
            <p className="text-xs text-muted-foreground">Categories on target</p>
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
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatTTD(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatTTD(Number(value))} />
                <Legend />
                <Bar dataKey="target" fill="hsl(var(--muted))" name="Target (50/30/20)" />
                <Bar dataKey="actual" fill="hsl(var(--primary))" name="Actual Spending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 50/30/20 Rule Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            50/30/20 Rule Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(summary.ruleComparison).map(([group, comparison]) => {
            const status = getVarianceStatus(comparison.variance);
            const actualPercentage = comparison.actual.toFixed(0);
            const targetPercentage = comparison.target.toFixed(0);
            
            return (
              <div key={group} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="capitalize font-medium">{group}</div>
                  <Badge variant={status === 'on-track' ? 'default' : status === 'over' ? 'destructive' : 'secondary'}>
                    {actualPercentage}% (target: {targetPercentage}%)
                  </Badge>
                </div>
                <div className={`font-semibold ${
                  comparison.variance > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {comparison.variance > 0 ? '+' : ''}{comparison.variance.toFixed(1)}%
                </div>
              </div>
            );
          })}
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Great news!</strong> You're under-budget in all categories except savings. 
                The negative values show you're spending less than the 50/30/20 targets, which means 
                you have room to increase your savings rate or enjoy a bit more flexibility in your wants category.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Experience the Full Power of Nuacha</h3>
          <p className="text-muted-foreground mb-4">
            Connect your real income and expenses for personalized budget insights, automated categorization, and smart financial planning.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Start Your Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/options">View All Features</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}