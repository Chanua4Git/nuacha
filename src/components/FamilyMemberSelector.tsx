
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { Users } from 'lucide-react';
import { FamilyMember } from '@/types/expense';
import { cn } from '@/lib/utils';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';

interface FamilyMemberSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

const FamilyMemberSelector = ({ value, onChange, className }: FamilyMemberSelectorProps) => {
  const { selectedFamily } = useExpense();
  const { members, isLoading } = useFamilyMembers(selectedFamily?.id);
  
  const getMember = (id: string): FamilyMember | undefined => 
    members.find(m => m.id === id);
  
  const selectedMember = value ? getMember(value) : undefined;

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center mb-2">
          <Skeleton className="h-5 w-5 mr-2 rounded-full" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className={cn("p-4 bg-accent/30 rounded-lg", className)}>
        <div className="flex items-center mb-2">
          <Users className="h-5 w-5 mr-2 text-muted-foreground" />
          <h2 className="text-lg font-medium">No Family Members</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          When you're ready, you can add family members to track expenses for specific individuals.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => toast("Family member creation coming soon", {
            description: "We're working on adding the ability to create family members directly."
          })}
        >
          Add Family Member
        </Button>
      </div>
    );
  }

  // Filter out members with empty IDs to avoid the error
  const validMembers = members.filter(member => member.id && member.id !== '');

  return (
    <div className={className}>
      <div className="flex items-center mb-2">
        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
        <label className="text-sm font-medium">Family Member</label>
      </div>
      <Select
        value={value || undefined}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a family member">
            {selectedMember && (
              <div className="flex items-center">
                {selectedMember.name}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50">
          {validMembers.map((member) => (
            <SelectItem 
              key={member.id} 
              value={member.id}
              className="flex items-center"
            >
              <div className="flex items-center">
                {member.name} - {member.type}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FamilyMemberSelector;
