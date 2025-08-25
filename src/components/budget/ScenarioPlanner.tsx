import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { formatTTD } from '@/utils/budgetUtils';
import { CategoryWithCamelCase } from '@/types/expense';
import { Play, RotateCcw, Save } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface ScenarioChange {
  categoryId: string;
  categoryName: string;
  currentAmount: number;
  newAmount: number;
  change: number;
}

// Extended category interface for budget categories
interface BudgetCategory extends CategoryWithCamelCase {
  groupType: string;
  userId: string;
}

export default function ScenarioPlanner() {
  const { user } = useAuth();
  const { categories, isLoading: loading } = useCategories();
  const [selectedMonth] = useState(new Date());
  const { summary } = useBudgetSummary(selectedMonth);
  
  // Filter categories to only show budget categories
  const budgetCategories = categories.filter(cat => 
    // Check for budget categories (have groupType and no familyId)
    (cat as any).groupType && cat.familyId === null && (cat as any).userId === user?.id
  ) as BudgetCategory[];

  // Group budget categories by type
  const categoriesByGroup = budgetCategories.reduce((acc, category) => {
    const groupType = category.groupType;
    if (!acc[groupType]) {
      acc[groupType] = [];
    }
    acc[groupType].push(category);
    return acc;
  }, {} as Record<string, BudgetCategory[]>);

  const [scenarioChanges, setScenarioChanges] = useState<Record<string, number>>({});
  const [scenarioName, setScenarioName] = useState('');

  const applyScenarioChange = (categoryId: string, change: number) => {
    setScenarioChanges(prev => ({
      ...prev,
      [categoryId]: change
    }));
  };

  const resetScenario = () => {
    setScenarioChanges({});
    setScenarioName('');
  };

  const saveScenario = () => {
    if (!scenarioName.trim()) {
      alert('Please enter a scenario name');
      return;
    }
    // TODO: Implement save scenario to database
    console.log('Saving scenario:', { name: scenarioName, changes: scenarioChanges });
  };

  // Calculate scenario impact first
  const scenarioSummary = summary ? { ...summary } : null;
  if (scenarioSummary) {
    Object.entries(scenarioChanges).forEach(([categoryId, change]) => {
      const category = Object.values(categoriesByGroup).flat().find(c => c.id === categoryId);
      if (category && category.groupType) {
        scenarioSummary.byGroup[category.groupType].total += change;
        scenarioSummary.totalExpenses += change;
        scenarioSummary.surplus -= change;
      }
    });
  }

  if (loading || !summary || !scenarioSummary) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent className="animate-pulse">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/4"></div>
          </CardHeader>
          <CardContent className="animate-pulse">
            <div className="h-64 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate scenario impact
  // Recalculate percentages for scenario
  if (scenarioSummary && scenarioSummary.totalIncome > 0) {
    Object.keys(scenarioSummary.byGroup).forEach(group => {
      scenarioSummary.byGroup[group].percentage = 
        (scenarioSummary.byGroup[group].total / scenarioSummary.totalIncome) * 100;
      
      scenarioSummary.ruleComparison[group].actual = scenarioSummary.byGroup[group].percentage;
      scenarioSummary.ruleComparison[group].variance = 
        scenarioSummary.byGroup[group].percentage - scenarioSummary.ruleComparison[group].target;
    });
  }

  const pieData = scenarioSummary ? [
    { name: 'Needs', value: scenarioSummary.byGroup.needs.total, color: '#ef4444' },
    { name: 'Wants', value: scenarioSummary.byGroup.wants.total, color: '#f59e0b' },
    { name: 'Savings', value: scenarioSummary.byGroup.savings.total, color: '#10b981' }
  ] : [];

  const comparisonData = (scenarioSummary && summary) ? [
    {
      name: 'Current',
      needs: summary.byGroup.needs.total,
      wants: summary.byGroup.wants.total,
      savings: summary.byGroup.savings.total
    },
    {
      name: 'Scenario',
      needs: scenarioSummary.byGroup.needs.total,
      wants: scenarioSummary.byGroup.wants.total,
      savings: scenarioSummary.byGroup.savings.total
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Scenario Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            What-If Scenario Planner
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Adjust your spending in different categories to see how it affects your budget
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g., Night Nurse Budget, Vacation Planning"
              />
            </div>
            <Button onClick={resetScenario} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveScenario} disabled={!scenarioName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Scenario
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Adjustments */}
        <Card>
          <CardHeader>
            <CardTitle>Adjust Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(categoriesByGroup).map(([groupType, categories]) => (
              <div key={groupType}>
                <h3 className="font-medium mb-3 capitalize">{groupType}</h3>
                <div className="space-y-4">
                  {categories.slice(0, 3).map((category) => {
                    const currentSpent = summary ? 
                      summary.byGroup[category.groupType].total / categories.length : 0; // Simplified
                    const change = scenarioChanges[category.id] || 0;
                    const newAmount = currentSpent + change;
                    
                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{category.name}</span>
                          <span>{formatTTD(newAmount)}</span>
                        </div>
                        <div className="px-3">
                          <Slider
                            value={[change]}
                            onValueChange={([value]) => applyScenarioChange(category.id, value)}
                            min={-currentSpent}
                            max={500}
                            step={10}
                            className="w-full"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>-{formatTTD(currentSpent)}</span>
                          <span className={change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : ''}>
                            {change > 0 ? '+' : ''}{formatTTD(change)}
                          </span>
                          <span>+{formatTTD(500)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Scenario Results */}
        <div className="space-y-6">
          {/* Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTTD(scenarioSummary.totalExpenses)}</div>
                  <div className="text-sm text-muted-foreground">Total Expenses</div>
                  <div className="text-xs">
                    {scenarioSummary.totalExpenses > summary.totalExpenses ? (
                      <span className="text-red-600">
                        +{formatTTD(scenarioSummary.totalExpenses - summary.totalExpenses)}
                      </span>
                    ) : scenarioSummary.totalExpenses < summary.totalExpenses ? (
                      <span className="text-green-600">
                        -{formatTTD(summary.totalExpenses - scenarioSummary.totalExpenses)}
                      </span>
                    ) : (
                      <span>No change</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${scenarioSummary.surplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatTTD(scenarioSummary.surplus)}
                  </div>
                  <div className="text-sm text-muted-foreground">Surplus</div>
                  <div className="text-xs">
                    {scenarioSummary.surplus > summary.surplus ? (
                      <span className="text-green-600">
                        +{formatTTD(scenarioSummary.surplus - summary.surplus)}
                      </span>
                    ) : scenarioSummary.surplus < summary.surplus ? (
                      <span className="text-red-600">
                        -{formatTTD(summary.surplus - scenarioSummary.surplus)}
                      </span>
                    ) : (
                      <span>No change</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scenario Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
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

          {/* Rule Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>Rule Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(scenarioSummary.ruleComparison).map(([group, comparison]) => (
                  <div key={group} className="flex justify-between items-center">
                    <span className="capitalize">{group}</span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={Math.abs(comparison.variance) <= 5 ? 'secondary' : 'destructive'}
                        className="min-w-[60px] justify-center"
                      >
                        {Math.round(comparison.actual)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground w-12">
                        vs {comparison.target}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Current vs Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => formatTTD(value as number)} />
              <Legend />
              <Bar dataKey="needs" fill="#ef4444" name="Needs" />
              <Bar dataKey="wants" fill="#f59e0b" name="Wants" />
              <Bar dataKey="savings" fill="#10b981" name="Savings" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}