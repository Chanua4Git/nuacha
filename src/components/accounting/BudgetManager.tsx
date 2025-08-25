
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBudgets } from '@/hooks/useBudgets';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';
import { BudgetFormData } from '@/types/accounting';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useAuth } from '@/auth/contexts/AuthProvider';

interface BudgetManagerProps {
  familyId: string;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BudgetManager: React.FC<BudgetManagerProps> = ({ familyId }) => {
  const { user } = useAuth();
  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const { categories, isLoading: categoriesLoading } = useUnifiedCategories({ 
    familyId, 
    mode: 'family-only' 
  });
  const {
    budgetsWithCategories,
    isLoading: budgetsLoading,
    createBudget,
    updateBudget,
    deleteBudget
  } = useBudgets(familyId, selectedMonth, selectedYear);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  
  const defaultFormData: BudgetFormData = {
    familyId,
    categoryId: '',
    month: selectedMonth,
    year: selectedYear,
    amount: 0
  };
  
  const [formData, setFormData] = useState<BudgetFormData>(defaultFormData);
  
  const resetForm = () => {
    setFormData({
      ...defaultFormData,
      month: selectedMonth,
      year: selectedYear
    });
    setEditingBudget(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBudget) {
        await updateBudget(editingBudget, {
          amount: formData.amount
        });
      } else {
        await createBudget(formData);
      }
      
      resetForm();
      setFormOpen(false);
    } catch (err) {
      console.error('Error saving budget:', err);
    }
  };
  
  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget.id);
    setFormData({
      familyId: budget.family_id,
      categoryId: budget.category_id,
      month: budget.month,
      year: budget.year,
      amount: budget.amount
    });
    setFormOpen(true);
  };
  
  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudget(id);
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };
  
  // Generate an array of years (current year +/- 5 years)
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  const isLoading = categoriesLoading || budgetsLoading;
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Manager</CardTitle>
          <CardDescription>
            Please log in to manage your budgets.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Filter out categories with empty IDs to prevent the error
  const validCategories = categories.filter(category => category.id && category.id !== '');
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget Manager</CardTitle>
          <CardDescription>
            Set and manage your monthly budgets
          </CardDescription>
        </div>
        <Button onClick={() => { resetForm(); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Budget
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(year) => setSelectedYear(parseInt(year))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : budgetsWithCategories.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>No budgets set for {selectedMonth} {selectedYear}.</p>
            <p className="text-sm">Create a budget to start tracking your expenses against it.</p>
          </div>
        ) : (
          <div className="border rounded-md divide-y">
            {budgetsWithCategories.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: budget.category?.color || '#5A7684' }}
                  />
                  <span>{budget.category?.name || 'Unknown Category'}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="font-medium">${budget.amount.toFixed(2)}</span>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditBudget(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Budget</DialogTitle>
                        </DialogHeader>
                        <p>
                          Are you sure you want to delete the budget for "{budget.category?.name}"? 
                          This action cannot be undone.
                        </p>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {}}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? 'Edit Budget' : 'New Budget'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="category" className="text-right text-sm font-medium">
                  Category
                </label>
                <Select
                  value={formData.categoryId || undefined}
                  onValueChange={(value) => setFormData({...formData, categoryId: value})}
                  disabled={!!editingBudget}
                >
                  <SelectTrigger className="col-span-3" id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {validCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {!editingBudget && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="month" className="text-right text-sm font-medium">
                      Month
                    </label>
                    <Select
                      value={formData.month}
                      onValueChange={(value) => setFormData({...formData, month: value})}
                    >
                      <SelectTrigger className="col-span-3" id="month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(month => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="year" className="text-right text-sm font-medium">
                      Year
                    </label>
                    <Select
                      value={formData.year.toString()}
                      onValueChange={(value) => setFormData({...formData, year: parseInt(value)})}
                    >
                      <SelectTrigger className="col-span-3" id="year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="amount" className="text-right text-sm font-medium">
                  Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({
                    ...formData, 
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.categoryId}>
                {editingBudget ? 'Save Changes' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BudgetManager;
