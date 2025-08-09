import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatTTD, getMonthDisplay, getVarianceStatus } from '@/utils/budgetUtils';

// Mock data for demo
const demoSummary = {
  totalIncome: 12000,
  totalExpenses: 9500,
  byGroup: {
    needs: { total: 5500, percentage: 45.8 },
    wants: { total: 2800, percentage: 23.3 },
    savings: { total: 1200, percentage: 10.0 }
  },
  surplus: 2500,
  ruleComparison: {
    needs: { actual: 45.8, target: 50, variance: -4.2 },
    wants: { actual: 23.3, target: 30, variance: -6.7 },
    savings: { actual: 10.0, target: 20, variance: -10.0 }
  }
};

const pieData = [
  { name: 'Needs', value: demoSummary.byGroup.needs.total, fill: 'hsl(var(--chart-1))' },
  { name: 'Wants', value: demoSummary.byGroup.wants.total, fill: 'hsl(var(--chart-2))' },
  { name: 'Savings', value: demoSummary.byGroup.savings.total, fill: 'hsl(var(--chart-3))' }
];

const barData = [
  { name: 'Budget vs Actual', budget: 12000, actual: 9500 }
];

export default function DemoBudgetDashboard() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setSelectedMonth(newMonth);
  };

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <h2 className="text-xl font-semibold">{getMonthDisplay(selectedMonth)}</h2>
        <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatTTD(demoSummary.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatTTD(demoSummary.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surplus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatTTD(demoSummary.surplus)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule Compliance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm">
              Needs: On Track
            </Badge>
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
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatTTD(Number(value))} />
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
                <YAxis tickFormatter={(value) => formatTTD(value)} />
                <Tooltip formatter={(value) => formatTTD(Number(value))} />
                <Legend />
                <Bar dataKey="budget" fill="hsl(var(--chart-1))" name="Income" />
                <Bar dataKey="actual" fill="hsl(var(--chart-2))" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rule Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>50/30/20 Rule Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(demoSummary.ruleComparison).map(([group, data]) => {
              const status = getVarianceStatus(data.variance);
              return (
                <div key={group} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="capitalize font-medium">{group}</div>
                    <Badge variant={status === 'on-track' ? 'default' : status === 'over' ? 'destructive' : 'secondary'}>
                      {data.actual.toFixed(1)}% (target: {data.target}%)
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.variance > 0 ? '+' : ''}{data.variance.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}