import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useExpense } from '@/context/ExpenseContext';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CategoryFormDialogProps {
  trigger?: React.ReactNode;
  budgetMode?: boolean;
  groupType?: 'needs' | 'wants' | 'savings';
  onSuccess?: () => void;
}

export default function CategoryFormDialog({ 
  trigger, 
  budgetMode = false, 
  groupType,
  onSuccess 
}: CategoryFormDialogProps) {
  const { user } = useAuth();
  const { selectedFamily } = useExpense();
  const { createCategory } = useCategories();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6B7280');
  const [selectedGroupType, setSelectedGroupType] = useState<string>(groupType || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (budgetMode && !selectedGroupType) {
      toast.error('Please select a group type for budget categories');
      return;
    }

    setIsSubmitting(true);

    try {
      await createCategory({
        name: name.trim(),
        color,
        familyId: budgetMode ? undefined : selectedFamily?.id,
        userId: budgetMode ? user?.id : undefined,
        groupType: budgetMode ? selectedGroupType as any : undefined,
        isBudgetCategory: budgetMode,
        sortOrder: 0
      });

      // Reset form
      setName('');
      setColor('#6B7280');
      setSelectedGroupType(groupType || '');
      setOpen(false);
      
      onSuccess?.();
      
      toast.success('Category created successfully');
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Add Category
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {budgetMode ? 'Add Budget Category' : 'Add Category'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              disabled={isSubmitting}
            />
          </div>

          {budgetMode && (
            <div className="space-y-2">
              <Label htmlFor="groupType">Group Type</Label>
              <Select 
                value={selectedGroupType} 
                onValueChange={setSelectedGroupType}
                disabled={!!groupType || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="needs">Needs (Essential)</SelectItem>
                  <SelectItem value="wants">Wants (Lifestyle)</SelectItem>
                  <SelectItem value="savings">Savings & Investments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-8 p-1 border rounded"
                disabled={isSubmitting}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6B7280"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}