import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Upload } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { toast } from 'sonner';
import ExpenseTypeSelector, { ExpenseType } from '../expense-form/ExpenseTypeSelector';
import DateSelector from '../expense-form/DateSelector';
import { format } from 'date-fns';

interface BulkExpenseItem {
  id: string;
  amount: string;
  description: string;
  place: string;
  date: Date;
}

interface QuickAddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string;
  categoryName?: string;
}

const QuickAddExpenseModal = ({
  isOpen,
  onClose,
  categoryId,
  categoryName
}: QuickAddExpenseModalProps) => {
  const { selectedFamily, createExpense } = useExpense();
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [expenseType, setExpenseType] = useState<ExpenseType>('actual');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single expense state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Bulk expense state
  const [bulkItems, setBulkItems] = useState<BulkExpenseItem[]>([
    { id: '1', amount: '', description: '', place: '', date: new Date() }
  ]);

  const handleClose = () => {
    // Reset form
    setMode('single');
    setExpenseType('actual');
    setAmount('');
    setDescription('');
    setPlace('');
    setDate(new Date());
    setBulkItems([{ id: '1', amount: '', description: '', place: '', date: new Date() }]);
    onClose();
  };

  const addBulkItem = () => {
    const newId = (bulkItems.length + 1).toString();
    setBulkItems([...bulkItems, {
      id: newId,
      amount: '',
      description: '',
      place: '',
      date: new Date()
    }]);
  };

  const removeBulkItem = (id: string) => {
    setBulkItems(bulkItems.filter(item => item.id !== id));
  };

  const updateBulkItem = (id: string, field: keyof BulkExpenseItem, value: any) => {
    setBulkItems(bulkItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    if (!selectedFamily) {
      toast.error('Please select a family first');
      return;
    }

    setIsSubmitting(true);

    try {
      const itemsToProcess = mode === 'single' 
        ? [{ amount, description, place, date: date! }]
        : bulkItems.filter(item => item.amount && item.description);

      if (itemsToProcess.length === 0) {
        toast.error('Please fill in at least one complete expense');
        return;
      }

      const createdExpenses = [];

      for (const item of itemsToProcess) {
        const newExpense = await createExpense({
          familyId: selectedFamily.id,
          amount: parseFloat(item.amount),
          description: item.description,
          category: categoryName || 'General',
          date: format(item.date, 'yyyy-MM-dd'),
          place: item.place || 'Not specified',
          expenseType,
          budgetCategoryId: categoryId,
        } as any);

        createdExpenses.push(newExpense);
      }

      const expenseCount = createdExpenses.length;
      toast.success(`${expenseCount} ${expenseType} expense${expenseCount > 1 ? 's' : ''} added successfully`);
      handleClose();

    } catch (error) {
      console.error('Error adding expenses:', error);
      toast.error('An error occurred while adding expenses');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Add Expense{mode === 'bulk' ? 's' : ''} to {categoryName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('single')}
            >
              Single Entry
            </Button>
            <Button
              type="button"
              variant={mode === 'bulk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('bulk')}
            >
              Bulk Entry
            </Button>
          </div>

          {/* Expense Type Selector */}
          <ExpenseTypeSelector
            value={expenseType}
            onChange={setExpenseType}
          />

          {/* Single Entry Mode */}
          {mode === 'single' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="What was this expense for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="place">Place</Label>
                <Input
                  id="place"
                  placeholder="Where was this purchased?"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                />
              </div>

              <DateSelector
                date={date}
                onSelect={setDate}
              />
            </div>
          )}

          {/* Bulk Entry Mode */}
          {mode === 'bulk' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Expense Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBulkItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bulkItems.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {bulkItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBulkItem(item.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => updateBulkItem(item.id, 'amount', e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateBulkItem(item.id, 'description', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Place"
                        value={item.place}
                        onChange={(e) => updateBulkItem(item.id, 'place', e.target.value)}
                      />
                      <Input
                        type="date"
                        value={format(item.date, 'yyyy-MM-dd')}
                        onChange={(e) => updateBulkItem(item.id, 'date', new Date(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : `Add ${mode === 'bulk' ? `${bulkItems.length} ` : ''}Expense${mode === 'bulk' ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddExpenseModal;