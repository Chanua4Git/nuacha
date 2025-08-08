import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { formatTTD, getVarianceStatus, getMonthDisplay } from '@/utils/budgetUtils';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

export default function BudgetDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { summary, loading, error } = useBudgetSummary(selectedMonth);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedMonth(newDate);
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
    { name: 'Needs', value: summary.byGroup.needs.total, color: '#ef4444' },
    { name: 'Wants', value: summary.byGroup.wants.total, color: '#f59e0b' },
    { name: 'Savings', value: summary.byGroup.savings.total, color: '#10b981' }
  ];

  const barData = [
    {
      name: 'Budget',
      income: summary.totalIncome,
      needs: summary.totalIncome * (summary.ruleComparison.needs.target / 100),
      wants: summary.totalIncome * (summary.ruleComparison.wants.target / 100),
      savings: summary.totalIncome * (summary.ruleComparison.savings.target / 100)
    },
    {
      name: 'Actual',
      income: summary.totalIncome,
      needs: summary.byGroup.needs.total,
      wants: summary.byGroup.wants.total,
      savings: summary.byGroup.savings.total
    }
  ];

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">{getMonthDisplay(selectedMonth)}</h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTTD(summary.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Monthly equivalent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTTD(summary.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalIncome > 0 ? Math.round((summary.totalExpenses / summary.totalIncome) * 100) : 0}% of income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surplus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatTTD(summary.surplus)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.surplus >= 0 ? 'Available to save' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule Compliance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Needs</span>
                <Badge variant={getVarianceStatus(summary.ruleComparison.needs.variance) === 'on-track' ? 'secondary' : 'destructive'}>
                  {Math.round(summary.ruleComparison.needs.actual)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Wants</span>
                <Badge variant={getVarianceStatus(summary.ruleComparison.wants.variance) === 'on-track' ? 'secondary' : 'destructive'}>
                  {Math.round(summary.ruleComparison.wants.actual)}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Savings</span>
                <Badge variant={getVarianceStatus(summary.ruleComparison.savings.variance) === 'on-track' ? 'secondary' : 'destructive'}>
                  {Math.round(summary.ruleComparison.savings.actual)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value) => formatTTD(value as number)} />
                <Legend />
                <Bar dataKey="needs" stackId="a" fill="#ef4444" name="Needs" />
                <Bar dataKey="wants" stackId="a" fill="#f59e0b" name="Wants" />
                <Bar dataKey="savings" stackId="a" fill="#10b981" name="Savings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        {Object.entries(summary.ruleComparison).map(([group, comparison]) => {
          const status = getVarianceStatus(comparison.variance);
          if (status === 'on-track') return null;
          
          return (
            <Card key={group} className={status === 'over' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {status === 'over' ? (
                    <TrendingUp className="h-5 w-5 text-red-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-medium capitalize">{group}</span>
                  <span className="text-sm text-muted-foreground">
                    {status === 'over' ? 'over budget by' : 'under budget by'} {Math.abs(comparison.variance).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}