import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useFamilies } from '@/hooks/useFamilies';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useBudgetCategoryInit } from '@/hooks/useBudgetCategoryInit';
import { formatTTD, toMonthly } from '@/utils/budgetUtils';
import { BudgetGroupType } from '@/types/budget';
import { Plus, TrendingUp, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ExpenseManager() {
  const { user } = useAuth();
  const { families } = useFamilies();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('all');
  
  // Initialize budget categories for the user if they don't exist
  useBudgetCategoryInit();
  
  // Set default family when families are loaded
  useEffect(() => {
    if (families.length > 0 && selectedFamilyId === 'all') {
      // Keep 'all' as default to show all families
    }
  }, [families, selectedFamilyId]);
  
  // Fetch categories for all families to get comprehensive budget categories
  const { categories, isLoading: categoriesLoading } = useCategories(undefined, true);

  // Filter categories to include budget categories for the selected family or all families
  const budgetCategories = categories.filter(cat => {
    const isBudgetCategory = cat.isBudgetCategory === true && cat.groupType != null;
    if (!isBudgetCategory) return false;
    
    // If "All Families" is selected, include user-level categories and all family-level categories
    if (selectedFamilyId === 'all') {
      return (cat.userId === user?.id && cat.familyId == null) || 
             (cat.familyId != null && families.some(f => f.id === cat.familyId));
    }
    
    // If specific family is selected, include user-level categories and that family's categories
    return (cat.userId === user?.id && cat.familyId == null) || 
           (cat.familyId === selectedFamilyId);
  });

  console.log('Budget categories found:', budgetCategories.length);
  if (budgetCategories.length > 0) {
    console.log('Sample categories:', budgetCategories.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name,
      groupType: c.groupType
    })));
  }
  
  // If no budget categories exist, create them automatically
  useEffect(() => {
    if (user && budgetCategories.length === 0 && !categoriesLoading) {
      // Trigger creation of default budget categories
      // This will be handled by the unified category system
      console.log('No budget categories found for user, they should be created automatically');
    }
  }, [user, budgetCategories.length, categoriesLoading]);

  // Group budget categories by type
  const categoriesByGroup = budgetCategories.reduce((acc, category) => {
    const groupType = category.groupType;
    if (!groupType) {
      console.warn('Category missing groupType:', category);
      return acc;
    }
    if (!acc[groupType]) {
      acc[groupType] = [];
    }
    acc[groupType].push(category);
    return acc;
  }, {} as Record<string, typeof categories>);
  
  console.log('Categories by group:', categoriesByGroup);
  console.log('Budget categories found:', budgetCategories.length);
  
  // Fetch expenses based on selected family
  const { expenses, isLoading: expensesLoading } = useExpenses({
    familyId: selectedFamilyId === 'all' ? undefined : selectedFamilyId
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
    // Use the budget_category_id field to match expenses to categories
    const category = budgetCategories.find(cat => cat.id === expense.budgetCategoryId);
    
    if (category) {
      acc[category.id] = (acc[category.id] || 0) + expense.amount;
      console.log(`Matched expense "${expense.description}" (${expense.amount}) to category "${category.name}"`);
    } else {
      console.warn('No matching budget category found for expense:', {
        expenseId: expense.id,
        description: expense.description,
        budgetCategoryId: expense.budgetCategoryId,
        amount: expense.amount
      });
    }
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Expenses by category totals:', expensesByCategory);

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
      {/* Header with Family Selection and Month Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Expense Categories</h2>
          <p className="text-muted-foreground">Organize your spending into Needs, Wants, and Savings</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Family Selector */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedFamilyId} onValueChange={setSelectedFamilyId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select family" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Families</SelectItem>
                {families.map((family) => (
                  <SelectItem key={family.id} value={family.id}>
                    <div className="flex items-center">
                      <span 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: family.color }}
                      />
                      {family.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
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
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total spending by category for {getMonthDisplay(selectedMonth)}
            {selectedFamilyId === 'all' ? ' - All Families' : ` - ${families.find(f => f.id === selectedFamilyId)?.name}`}
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => console.log('Add category for group:', groupType)}
                  >
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => console.log('Add category for group:', groupType)}
                >
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
                      expense => expense.budgetCategoryId === category.id
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
                              {categoryExpenses.slice(0, 2).map((expense) => {
                                const expenseFamily = families.find(f => f.id === expense.familyId);
                                return (
                                  <div key={expense.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 truncate max-w-[120px]">
                                      {selectedFamilyId === 'all' && expenseFamily && (
                                        <span 
                                          className="w-2 h-2 rounded-full flex-shrink-0" 
                                          style={{ backgroundColor: expenseFamily.color }}
                                        />
                                      )}
                                      <span className="truncate">{expense.description}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                      {formatTTD(expense.amount)}
                                    </span>
                                  </div>
                                );
                              })}
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => console.log('Add expense for category:', category.name)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Expense
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