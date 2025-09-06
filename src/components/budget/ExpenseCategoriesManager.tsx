import React, { useState } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { comprehensiveCategories } from '@/data/comprehensiveCategories';
import QuickAddExpenseModal from './QuickAddExpenseModal';
import { useBudgetTemplates } from '@/hooks/useBudgetTemplates';
import { useBudgetSummary } from '@/hooks/useBudgetSummary';

export const ExpenseCategoriesManager = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<{
    id: string;
    name: string;
  } | null>(null);
  
  const { selectedFamily, expenses, categories } = useExpense();
  const { getDefaultTemplate } = useBudgetTemplates(selectedFamily?.id || '');
  const { summary: budgetSummary } = useBudgetSummary(startOfMonth(selectedMonth), endOfMonth(selectedMonth), selectedFamily?.id);
  
  // Filter expenses by selected month using string comparison (avoids timezone issues)
  
  // Filter expenses by selected month using string comparison (avoids timezone issues)
  const monthStartString = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
  const monthEndString = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
  
  const monthlyExpenses = expenses.filter(expense => {
    return expense.date >= monthStartString && expense.date <= monthEndString;
  });
  
  // Filter to only budget categories
  const budgetCategories = categories.filter(cat => cat.isBudgetCategory);

  // Map database categories to parent categories
  const mapDatabaseCategoryToParent = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase().trim();
    
    // First try direct mapping to comprehensive categories
    const directMatch = comprehensiveCategories.find(parent => 
      parent.children?.some(child => 
        child.name.toLowerCase() === normalizedName ||
        normalizedName.includes(child.name.toLowerCase()) ||
        child.name.toLowerCase().includes(normalizedName)
      )
    );
    
    if (directMatch) return directMatch;
    
    // Enhanced keyword mapping
    const keywordMap: Record<string, string> = {
      'groceries': 'Groceries & Household Supplies',
      'food': 'Groceries & Household Supplies',
      'household': 'Groceries & Household Supplies',
      'rent': 'Housing & Utilities',
      'mortgage': 'Housing & Utilities',
      'electricity': 'Housing & Utilities',
      'gas': 'Housing & Utilities',
      'water': 'Housing & Utilities',
      'utilities': 'Housing & Utilities',
      'internet': 'Housing & Utilities',
      'cable': 'Housing & Utilities',
      'medical': 'Caregiving & Medical',
      'doctor': 'Caregiving & Medical',
      'medication': 'Caregiving & Medical',
      'health': 'Caregiving & Medical',
      'dental': 'Caregiving & Medical',
      'transport': 'Transportation',
      'fuel': 'Transportation',
      'vehicle': 'Transportation',
      'car': 'Transportation',
      'taxi': 'Transportation',
      'insurance': 'Insurance & Financial',
      'school': 'Education & Child Expenses',
      'education': 'Education & Child Expenses',
      'child': 'Education & Child Expenses',
      'cleaning': 'Household Operations',
      'repair': 'Household Operations',
      'maintenance': 'Household Operations',
      'dining': 'Entertainment & Leisure',
      'restaurant': 'Entertainment & Leisure',
      'entertainment': 'Entertainment & Leisure',
      'gym': 'Personal Care & Wellness',
      'spa': 'Personal Care & Wellness',
      'haircut': 'Personal Care & Wellness',
      'gift': 'Gifts & Special Occasions',
      'travel': 'Travel & Holidays',
      'holiday': 'Travel & Holidays',
      'savings': 'Insurance & Financial',
      'investment': 'Insurance & Financial',
    };
    
    for (const [keyword, parentName] of Object.entries(keywordMap)) {
      if (normalizedName.includes(keyword)) {
        return comprehensiveCategories.find(cat => cat.name === parentName);
      }
    }
    
    // Default to Miscellaneous
    return comprehensiveCategories.find(cat => cat.name === 'Miscellaneous');
  };

  // Organize categories hierarchically by parent
  const organizeCategories = () => {
    const organized = {
      needs: {} as Record<string, any[]>,
      wants: {} as Record<string, any[]>,
      savings: {} as Record<string, any[]>
    };

    budgetCategories.forEach(category => {
      const parentCategory = mapDatabaseCategoryToParent(category.name);
      const groupType = category.groupType as 'needs' | 'wants' | 'savings';
      
      if (parentCategory && organized[groupType]) {
        if (!organized[groupType][parentCategory.name]) {
          organized[groupType][parentCategory.name] = [];
        }
        organized[groupType][parentCategory.name].push({
          ...category,
          parentColor: parentCategory.color
        });
      }
    });

    // Sort categories within each parent group
    Object.keys(organized).forEach(groupType => {
      Object.keys(organized[groupType as keyof typeof organized]).forEach(parentName => {
        organized[groupType as keyof typeof organized][parentName].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
      });
    });

    return organized;
  };

  const categoriesByType = organizeCategories();

  // Calculate expenses by category for the selected month - include ALL expenses
  const expensesByCategory = monthlyExpenses.reduce((acc, expense) => {
    let category = null;
    
    // Priority 1: Use budget_category_id if available (preferred)
    if (expense.budgetCategoryId) {
      category = budgetCategories.find(cat => cat.id === expense.budgetCategoryId);
    }
    
    // Priority 2: Try category field as UUID
    if (!category && expense.category) {
      category = budgetCategories.find(cat => cat.id === expense.category);
    }
    
    // Priority 3: Exact name matching
    if (!category && expense.category) {
      category = budgetCategories.find(cat => cat.name.toLowerCase() === expense.category.toLowerCase());
    }
    
    // Priority 4: Enhanced fuzzy matching including description
    if (!category) {
      const categoryName = expense.category?.toLowerCase() || '';
      const description = expense.description?.toLowerCase() || '';
      
      category = budgetCategories.find(cat => {
        const catName = cat.name.toLowerCase();
        
        return (
          // Groceries/Food matching (including JTA supermarket)
          (categoryName.includes('groceries') || description.includes('jta') || description.includes('supermarket') || description.includes('grocery')) && catName.includes('groceries') ||
          categoryName.includes('food') && catName.includes('food') ||
          categoryName.includes('household') && catName.includes('household') ||
          categoryName.includes('medical') && catName.includes('medical') ||
          categoryName.includes('transport') && catName.includes('transport') ||
          categoryName.includes('child') && catName.includes('child') ||
          categoryName.includes('school') && catName.includes('school')
        );
      });
    }
    
    // Priority 5: Default to first "wants" category if no match found
    if (!category) {
      category = budgetCategories.find(cat => cat.groupType === 'wants');
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
  const getAllCategoriesInGroup = (groupType: 'needs' | 'wants' | 'savings') => {
    return Object.values(categoriesByType[groupType]).flat();
  };

  // Get template expenses
  const defaultTemplate = getDefaultTemplate();
  const templateExpenses: { needs: number; wants: number; savings: number } = React.useMemo(() => {
    if (!defaultTemplate?.template_data) return { needs: 0, wants: 0, savings: 0 };
    
    const templateData = defaultTemplate.template_data as any;
    
    const needsTotal = templateData?.needs ? 
      Object.values(templateData.needs).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) : 0;
    const wantsTotal = templateData?.wants ? 
      Object.values(templateData.wants).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) : 0;
    const savingsTotal = templateData?.savings ? 
      Object.values(templateData.savings).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) : 0;
    
    return {
      needs: needsTotal as number,
      wants: wantsTotal as number,
      savings: savingsTotal as number
    };
  }, [defaultTemplate]);

  const groupTotals = {
    needs: getAllCategoriesInGroup('needs').reduce((sum, cat) => sum + (expensesByCategory[cat.id]?.total || 0), 0),
    wants: getAllCategoriesInGroup('wants').reduce((sum, cat) => sum + (expensesByCategory[cat.id]?.total || 0), 0),
    savings: getAllCategoriesInGroup('savings').reduce((sum, cat) => sum + (expensesByCategory[cat.id]?.total || 0), 0)
  };

  // Combined totals (template + manual)
  const combinedTotals = {
    needs: groupTotals.needs + templateExpenses.needs,
    wants: groupTotals.wants + templateExpenses.wants,
    savings: groupTotals.savings + templateExpenses.savings
  };

  const totalSpending = combinedTotals.needs + combinedTotals.wants + combinedTotals.savings;

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

  const handleAddExpense = (categoryId: string, categoryName: string) => {
    setSelectedCategoryForAdd({ id: categoryId, name: categoryName });
    setQuickAddModalOpen(true);
  };


  const renderCategorySection = (type: 'needs' | 'wants' | 'savings', title: string, badgeVariant: string) => {
    const parentGroups = categoriesByType[type];
    const sectionEmojis = {
      needs: '🔴',
      wants: '🟡', 
      savings: '💚'
    };
    
    return (
      <div key={type} className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={badgeVariant}>
            {sectionEmojis[type]} {title}
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
              {Object.entries(parentGroups).map(([parentName, categories]) => {
                const parentCategory = comprehensiveCategories.find(cat => cat.name === parentName);
                
                return (
                  <React.Fragment key={parentName}>
                    {/* Parent Category Header */}
                    <TableRow className="bg-muted/30">
                      <TableCell 
                        colSpan={4} 
                        className="font-semibold text-sm py-2"
                        style={{
                          borderLeft: `4px solid ${parentCategory?.color || '#64748B'}`,
                          paddingLeft: '12px'
                        }}
                      >
                        {parentName}
                      </TableCell>
                    </TableRow>
                    
                    {/* Child Categories */}
                    {categories.map(category => {
                      const recentExpenses = getRecentExpenses(category.id);
                      const monthlyTotal = expensesByCategory[category.id]?.total || 0;
                      
                      return (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium pl-8">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.parentColor || category.color }}
                              />
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell>${monthlyTotal.toFixed(2)}</TableCell>
                          <TableCell>
                            {recentExpenses ? (
                              <div className="space-y-1">
                                {recentExpenses.map(expense => (
                                  <div key={expense.id} className="text-sm">
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddExpense(category.id, category.name)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Expense
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
  };

  if (!selectedFamily) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select a family in the main app to view expense categories.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedFamily.color }}
            />
            <span className="font-medium">{selectedFamily.name}</span>
            <span className="text-sm text-muted-foreground">(synced with main app)</span>
          </div>
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
            Combined expenses for {format(selectedMonth, 'MMMM yyyy')} - {selectedFamily.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">${combinedTotals.needs.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">🔴 Needs (Essential)</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>🎯 Template: ${templateExpenses.needs.toFixed(2)}</div>
                <div>📱 Manual: ${groupTotals.needs.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${combinedTotals.wants.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">🟡 Wants (Lifestyle)</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>🎯 Template: ${templateExpenses.wants.toFixed(2)}</div>
                <div>📱 Manual: ${groupTotals.wants.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${combinedTotals.savings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">💚 Savings & Investments</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>🎯 Template: ${templateExpenses.savings.toFixed(2)}</div>
                <div>📱 Manual: ${groupTotals.savings.toFixed(2)}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                ${budgetSummary?.unpaidLaborValue ? budgetSummary.totalExpenses.toFixed(2) : (combinedTotals.needs + combinedTotals.wants + combinedTotals.savings).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">💰 Total Value</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>💵 Cash: ${(combinedTotals.needs + combinedTotals.wants + combinedTotals.savings).toFixed(2)}</div>
                {budgetSummary?.unpaidLaborValue && (
                  <div className="text-purple-600">🤝 Unpaid Labor: ${budgetSummary.unpaidLaborValue.toFixed(2)}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Total Summary */}
          <div className="mt-6 pt-4 border-t text-center">
            <div className="text-lg font-semibold">Total Combined: ${totalSpending.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              🎯 Template Planned: ${(templateExpenses.needs + templateExpenses.wants + templateExpenses.savings).toFixed(2)} | 
              📱 Manual Entry: ${(groupTotals.needs + groupTotals.wants + groupTotals.savings).toFixed(2)}
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

      {/* Quick Add Modal */}
      <QuickAddExpenseModal
        isOpen={quickAddModalOpen}
        onClose={() => {
          setQuickAddModalOpen(false);
          setSelectedCategoryForAdd(null);
        }}
        categoryId={selectedCategoryForAdd?.id}
        categoryName={selectedCategoryForAdd?.name}
      />
    </div>
  );
};