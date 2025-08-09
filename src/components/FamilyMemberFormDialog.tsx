
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
import { FamilyMember } from '@/types/expense';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { format } from 'date-fns';
import { Textarea } from './ui/textarea';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';

interface FamilyMemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyId: string;
  member?: FamilyMember;
}

const memberTypes = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
  { value: 'dependent', label: 'Dependent' },
  { value: 'pet', label: 'Pet' },
  { value: 'other', label: 'Other' }
];

const FamilyMemberFormDialog = ({ 
  open, 
  onOpenChange, 
  familyId, 
  member 
}: FamilyMemberFormDialogProps) => {
  const { createMember, updateMember } = useFamilyMembers(familyId);
  const [name, setName] = useState(member?.name || '');
  const [type, setType] = useState(member?.type || 'adult');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    member?.dateOfBirth ? new Date(member.dateOfBirth) : undefined
  );
  const [notes, setNotes] = useState(member?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!member;

  const resetForm = () => {
    setName(member?.name || '');
    setType(member?.type || 'adult');
    setDateOfBirth(member?.dateOfBirth ? new Date(member.dateOfBirth) : undefined);
    setNotes(member?.notes || '');
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type || !familyId) return;

    setIsSubmitting(true);
    try {
      const memberData = {
        familyId,
        name,
        type,
        dateOfBirth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : undefined,
        notes: notes || undefined
      };

      if (isEditMode && member) {
        await updateMember(member.id, memberData);
      } else {
        await createMember(memberData);
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving family member:', error);
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
          <DialogTitle>{isEditMode ? 'Edit Family Member' : 'Add New Family Member'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">Name</Label>
            <Input
              id="member-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="member-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="member-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {memberTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Date of Birth (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfBirth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfBirth ? format(dateOfBirth, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateOfBirth}
                  onSelect={setDateOfBirth}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="member-notes">Notes (Optional)</Label>
            <Textarea
              id="member-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
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
              disabled={isSubmitting || !name.trim() || !type}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyMemberFormDialog;
