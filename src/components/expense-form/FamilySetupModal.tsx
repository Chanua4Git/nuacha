import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info, Plus } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useFamilies } from '@/hooks/useFamilies';
import type { Family } from '@/types/expense';

interface FamilySetupModalProps {
  open: boolean;
  families: Family[];
  onFamilySelected: (familyId: string) => void;
  onFamilyCreated: (family: Family) => void;
  onOpenChange?: (open: boolean) => void;
}

const FamilySetupModal = ({ open, families, onFamilySelected, onFamilyCreated, onOpenChange }: FamilySetupModalProps) => {
  const { createFamily } = useFamilies();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#5A7684');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasExistingFamilies = families.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !color) return;

    setIsSubmitting(true);
    try {
      const newFamily = await createFamily({ name, color });
      if (newFamily) {
        onFamilyCreated(newFamily);
      }
    } catch (error) {
      console.error('Error creating family:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasExistingFamilies && !showCreateNew 
              ? 'Which family is this expense for?' 
              : "Let's set up your first family"}
          </DialogTitle>
          <DialogDescription>
            {hasExistingFamilies && !showCreateNew
              ? 'Select an existing family or create a new one.'
              : 'Before we save this expense, we need to know which family it belongs to.'}
          </DialogDescription>
        </DialogHeader>
        
        {hasExistingFamilies && !showCreateNew ? (
          // Mode A: User has families - show selector
          <div className="space-y-4 pt-2">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Choose which family this expense belongs to.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="family-select">Select Family</Label>
              <Select onValueChange={onFamilySelected}>
                <SelectTrigger id="family-select">
                  <SelectValue placeholder="Choose a family..." />
                </SelectTrigger>
                <SelectContent>
                  {families.map((family) => (
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

            <Button 
              type="button"
              variant="ghost" 
              className="w-full"
              onClick={() => setShowCreateNew(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Family
            </Button>
          </div>
        ) : (
          // Mode B: No families OR user clicked "Create New"
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Families help you organize expenses by household. You can create more families later.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="family-name">Family Name</Label>
                <Input
                  id="family-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter family name (e.g., My Household)"
                  required
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label>Family Color</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-full cursor-pointer border border-border"
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
                {hasExistingFamilies && showCreateNew && (
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateNew(false)}
                    className="w-full mb-2"
                  >
                    Back to Selection
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !name.trim() || !color}
                  className="w-full"
                >
                  {isSubmitting ? 'Creating...' : 'Create Family & Continue'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FamilySetupModal;
