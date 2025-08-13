import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit } from 'lucide-react';
import { formatTTD } from '@/utils/budgetUtils';
import { BudgetGroupType } from '@/types/budget';
import { toast } from 'sonner';

// Mock budget categories and expenses for demo
const demoBudgetCategories = {
  needs: [
    { id: '1', name: 'Care', expenses: [{ amount: 800, description: 'Childcare', date: '2024-01-15' }], monthlyTotal: 800 },
    { id: '2', name: 'Groceries', expenses: [{ amount: 1200, description: 'Weekly shopping', date: '2024-01-10' }], monthlyTotal: 1200 },
    { id: '3', name: 'Gas/Fuel', expenses: [{ amount: 600, description: 'Gas station', date: '2024-01-08' }], monthlyTotal: 600 },
    { id: '4', name: 'Transport', expenses: [{ amount: 400, description: 'Bus pass', date: '2024-01-01' }], monthlyTotal: 400 }
  ],
  wants: [
    { id: '5', name: 'Dining Out', expenses: [{ amount: 450, description: 'Restaurant visits', date: '2024-01-12' }], monthlyTotal: 450 },
    { id: '6', name: 'Entertainment', expenses: [{ amount: 350, description: 'Movies, games', date: '2024-01-20' }], monthlyTotal: 350 },
    { id: '7', name: 'Personal Care', expenses: [{ amount: 200, description: 'Spa, salon', date: '2024-01-18' }], monthlyTotal: 200 }
  ],
  savings: [
    { id: '8', name: 'Emergency Fund', expenses: [{ amount: 500, description: 'Monthly transfer', date: '2024-01-01' }], monthlyTotal: 500 },
    { id: '9', name: 'Investments', expenses: [{ amount: 300, description: 'Stock purchase', date: '2024-01-15' }], monthlyTotal: 300 }
  ]
};

const groupColors = {
  needs: 'bg-red-50 text-red-700 border-red-200',
  wants: 'bg-blue-50 text-blue-700 border-blue-200',
  savings: 'bg-green-50 text-green-700 border-green-200'
};

export default function DemoExpenseManager() {
  const [categoriesByGroup] = useState(demoBudgetCategories);

  const handleAddExpense = (groupType: BudgetGroupType) => {
    toast("Sign up to add real expenses", {
      description: `This is just a demo. In the full app, expenses are automatically categorized from your receipts into ${groupType}.`
    });
  };

  const handleEditCategory = (categoryId: string) => {
    toast("Sign up to customize categories", {
      description: "This is just a demo showing how budget categories work."
    });
  };

  const getTotalForGroup = (groupType: BudgetGroupType) => {
    return categoriesByGroup[groupType]?.reduce((sum, cat) => sum + cat.monthlyTotal, 0) || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Budget Categories & Expenses</h2>
          <p className="text-muted-foreground">Organize expenses by needs, wants, and savings</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(categoriesByGroup).map(([groupType, categories]) => (
          <Card key={groupType} className={groupColors[groupType as BudgetGroupType]}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg capitalize flex items-center justify-between">
                {groupType}
                <Badge variant="secondary" className="bg-white">
                  {categories.length} categories
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTTD(getTotalForGroup(groupType as BudgetGroupType))}
              </div>
              <p className="text-sm opacity-80 mt-1">Total this month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories by Group */}
      {Object.entries(categoriesByGroup).map(([groupType, categories]) => (
        <Card key={groupType}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="capitalize">{groupType} Categories</CardTitle>
              <Button size="sm" onClick={() => handleAddExpense(groupType as BudgetGroupType)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{category.name}</h4>
                      <Badge variant="outline">
                        {category.expenses.length} expense{category.expenses.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 text-sm text-muted-foreground">
                      Latest: {category.expenses[0]?.description || 'No expenses yet'}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatTTD(category.monthlyTotal)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCategory(category.id)}
                      className="mt-1 h-6 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}