import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useFamilies } from '@/hooks/useFamilies';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { formatTTD, toMonthly } from '@/utils/budgetUtils';
import { BudgetGroupType } from '@/types/budget';
import { Plus, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ExpenseManager() {
  const { user } = useAuth();
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { families } = useFamilies();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Get the first family ID for filtering expenses
  const familyId = families?.[0]?.id;

  // Filter categories to only show budget categories (user-level categories with group_type)
  const budgetCategories = categories.filter(cat => 
    // Check if category has groupType property (from migrated budget_categories)
    'groupType' in cat && cat.groupType && 'userId' in cat && cat.userId === user?.id
  );

  // Group budget categories by type
  const categoriesByGroup = budgetCategories.reduce((acc, category) => {
    const groupType = (category as any).groupType;
    if (!acc[groupType]) {
      acc[groupType] = [];
    }
    acc[groupType].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);
  
  const { expenses, isLoading: expensesLoading } = useExpenses({
    familyId: familyId
  });

  useEffect(() => {
    // Note: Budget categories are now managed through the unified category system
    // Default budget categories should be created when user first accesses budget
  }, []);

  const groupColors = {
    needs: 'bg-red-100 text-red-800 border-red-200',
    wants: 'bg-orange-100 text-orange-800 border-orange-200', 
    savings: 'bg-green-100 text-green-800 border-green-200'
  };

  const groupTitles = {
    needs: 'Needs (Essential)',
    wants: 'Wants (Lifestyle)',
    savings: 'Savings & Investments'
  };

  // Calculate expenses by category for the selected month
  const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  
  const monthlyExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
  });

  const expensesByCategory = monthlyExpenses.reduce((acc, expense) => {
    // Find the category by name and get its ID
    const category = budgetCategories.find(cat => cat.name === expense.category);
    if (category) {
      acc[category.id] = (acc[category.id] || 0) + expense.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getMonthDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (categoriesLoading || expensesLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-6 bg-muted rounded w-1/4"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expense Categories</h2>
          <p className="text-muted-foreground">Organize your spending into Needs, Wants, and Savings</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[140px] text-center">
            {getMonthDisplay(selectedMonth)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total spending by category for {getMonthDisplay(selectedMonth)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(groupTitles).map(([groupType, title]) => {
              const categories = categoriesByGroup[groupType] || [];
              const totalSpent = categories.reduce((sum, cat) => 
                sum + (expensesByCategory[cat.id] || 0), 0);
              
              return (
                <div key={groupType} className="text-center p-4 rounded-lg border">
                  <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
                  <div className="text-2xl font-bold mt-1">{formatTTD(totalSpent)}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {categories.length} categories
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Categories by Group */}
      {Object.entries(groupTitles).map(([groupType, title]) => {
        const categories = categoriesByGroup[groupType] || [];
        
        if (categories.length === 0) {
          return (
            <Card key={groupType}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={groupColors[groupType as BudgetGroupType]}>
                    {title}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  <p>No categories in this group yet.</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={groupType}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={groupColors[groupType as BudgetGroupType]}>
                    {title}
                  </Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  {categories.map((category) => {
                    const categoryExpenses = monthlyExpenses.filter(
                      expense => expense.category === category.name
                    );
                    const totalSpent = expensesByCategory[category.id] || 0;
                    
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatTTD(totalSpent)}</span>
                            {categoryExpenses.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {categoryExpenses.length} expenses
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {categoryExpenses.length > 0 ? (
                            <div className="text-sm space-y-1">
                              {categoryExpenses.slice(0, 2).map((expense) => (
                                <div key={expense.id} className="flex justify-between">
                                  <span className="truncate max-w-[120px]">
                                    {expense.description}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatTTD(expense.amount)}
                                  </span>
                                </div>
                              ))}
                              {categoryExpenses.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{categoryExpenses.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No expenses</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Integration Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <h4 className="font-medium text-blue-900">Smart Categorization</h4>
              <p className="text-sm text-blue-700 mt-1">
                When you upload receipts, expenses will be automatically categorized based on merchant and item details. 
                You can always adjust the categories manually.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}