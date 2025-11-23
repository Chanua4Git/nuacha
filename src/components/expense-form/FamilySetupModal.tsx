import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useFamilies } from '@/hooks/useFamilies';

interface FamilySetupModalProps {
  open: boolean;
  onFamilyCreated: () => void;
}

const FamilySetupModal = ({ open, onFamilyCreated }: FamilySetupModalProps) => {
  const { createFamily } = useFamilies();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#5A7684');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !color) return;

    setIsSubmitting(true);
    try {
      await createFamily({ name, color });
      onFamilyCreated();
    } catch (error) {
      console.error('Error creating family:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Let's set up your first family</DialogTitle>
          <DialogDescription>
            Before we save this expense, we need to know which family it belongs to.
          </DialogDescription>
        </DialogHeader>
        
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
            <Button 
              type="submit" 
              disabled={isSubmitting || !name.trim() || !color}
              className="w-full"
            >
              {isSubmitting ? 'Creating...' : 'Create Family & Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FamilySetupModal;
