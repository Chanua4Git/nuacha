import React, { useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useFamilies } from '@/hooks/useFamilies';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export const ExpenseCategoriesManager = () => {
  const { user } = useAuth();
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const { families } = useFamilies();
  const { categories: budgetCategories } = useCategories(
    selectedFamily === 'all' ? undefined : selectedFamily, 
    true
  );
  
  const { expenses } = useExpenses({
    familyId: selectedFamily === 'all' ? undefined : selectedFamily,
    startDate: startOfMonth(selectedMonth).toISOString(),
    endDate: endOfMonth(selectedMonth).toISOString()
  });

  // Filter to only budget categories
  const filteredBudgetCategories = budgetCategories.filter(cat => cat.isBudgetCategory);

  // Group categories by type
  const categoriesByType = {
    needs: filteredBudgetCategories.filter(cat => cat.groupType === 'needs'),
    wants: filteredBudgetCategories.filter(cat => cat.groupType === 'wants'),
    savings: filteredBudgetCategories.filter(cat => cat.groupType === 'savings')
  };

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    let category = filteredBudgetCategories.find(cat => cat.id === expense.category);
    if (!category) {
      category = filteredBudgetCategories.find(cat => cat.name === expense.category);
    }
    if (!category && expense.budgetCategoryId) {
      category = filteredBudgetCategories.find(cat => cat.id === expense.budgetCategoryId);
    }
    
    if (category) {
      if (!acc[category.id]) {
        acc[category.id] = { total: 0, expenses: [] };
      }
      acc[category.id].total += expense.amount;
      acc[category.id].expenses.push(expense);
    }
    
    return acc;
  }, {} as Record<string, { total: number; expenses: any[] }>);

  // Calculate totals for each group
  const groupTotals = {
    needs: categoriesByType.needs.reduce((sum, cat) => sum + (expensesByCategory[cat.id]?.total || 0), 0),
    wants: categoriesByType.wants.reduce((sum, cat) => sum + (expensesByCategory[cat.id]?.total || 0), 0),
    savings: categoriesByType.savings.reduce((sum, cat) => sum + (expensesByCategory[cat.id]?.total || 0), 0)
  };

  const totalSpending = groupTotals.needs + groupTotals.wants + groupTotals.savings;

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getRecentExpenses = (categoryId: string) => {
    const categoryData = expensesByCategory[categoryId];
    if (!categoryData || categoryData.expenses.length === 0) return null;
    
    return categoryData.expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
  };

  const getFamilyColor = (familyId: string) => {
    const family = families.find(f => f.id === familyId);
    return family?.color || '#6B7280';
  };

  const renderCategorySection = (type: 'needs' | 'wants' | 'savings', title: string, badgeVariant: string) => {
    const categories = categoriesByType[type];
    
    return (
      <div key={type} className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={badgeVariant}>
            {title}
          </Badge>
        </div>
        
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>This Month</TableHead>
                <TableHead>Recent Expenses</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(category => {
                const recentExpenses = getRecentExpenses(category.id);
                const monthlyTotal = expensesByCategory[category.id]?.total || 0;
                
                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>${monthlyTotal.toFixed(2)}</TableCell>
                    <TableCell>
                      {recentExpenses ? (
                        <div className="space-y-1">
                          {recentExpenses.map(expense => (
                            <div key={expense.id} className="flex items-center gap-2 text-sm">
                              {selectedFamily === 'all' && (
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: getFamilyColor(expense.familyId) }}
                                />
                              )}
                              <span className="text-muted-foreground">
                                {expense.description} - ${expense.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No expenses</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Expense
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedFamily} onValueChange={setSelectedFamily}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Families</SelectItem>
              {families.map(family => (
                <SelectItem key={family.id} value={family.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: family.color }}
                    />
                    {family.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Monthly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>
            Total spending by category for {format(selectedMonth, 'MMMM yyyy')} - {
              selectedFamily === 'all' ? 'All Families' : families.find(f => f.id === selectedFamily)?.name
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">${groupTotals.needs.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Needs (Essential)</div>
              <div className="text-xs text-muted-foreground">{categoriesByType.needs.length} categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${groupTotals.wants.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Wants (Lifestyle)</div>
              <div className="text-xs text-muted-foreground">{categoriesByType.wants.length} categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${groupTotals.savings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Savings & Investments</div>
              <div className="text-xs text-muted-foreground">{categoriesByType.savings.length} categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdowns */}
      <div className="space-y-8">
        {renderCategorySection('needs', 'Needs (Essential)', 'bg-destructive/10 text-destructive')}
        {renderCategorySection('wants', 'Wants (Lifestyle)', 'bg-orange-100 text-orange-800')}
        {renderCategorySection('savings', 'Savings & Investments', 'bg-green-100 text-green-800')}
      </div>

      {/* Info Note */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 Smart categorization: When you upload receipts, we'll automatically categorize your expenses 
            to help organize your spending into these budget categories.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};