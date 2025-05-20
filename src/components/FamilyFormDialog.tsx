
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Family } from '@/types/expense';
import { useExpense } from '@/context/ExpenseContext';
import { HexColorPicker } from 'react-colorful';

interface FamilyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family?: Family;
}

const FamilyFormDialog = ({ open, onOpenChange, family }: FamilyFormDialogProps) => {
  const { createFamily, updateFamily } = useExpense();
  const [name, setName] = useState(family?.name || '');
  const [color, setColor] = useState(family?.color || '#5A7684');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const isEditMode = !!family;

  const resetForm = () => {
    setName(family?.name || '');
    setColor(family?.color || '#5A7684');
    setShowColorPicker(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !color) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && family) {
        await updateFamily(family.id, { name, color });
      } else {
        await createFamily({ name, color });
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving family:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Family' : 'Add New Family'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="family-name">Family Name</Label>
            <Input
              id="family-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter family name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Family Color</Label>
            <div className="flex items-center space-x-2">
              <div 
                className="w-8 h-8 rounded-full cursor-pointer border border-gray-200"
                style={{ backgroundColor: color }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#5A7684"
                required
                className="flex-1"
              />
            </div>
            
            {showColorPicker && (
              <div className="mt-2">
                <HexColorPicker 
                  color={color} 
                  onChange={setColor} 
                  className="w-full" 
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !name.trim() || !color}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyFormDialog;
