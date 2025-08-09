
import { useState } from 'react';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useExpense } from '@/context/ExpenseContext';
import { Users, UserPlus } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { FamilyMember } from '@/types/expense';
import { ScrollArea } from './ui/scroll-area';
import FamilyMemberFormDialog from './FamilyMemberFormDialog';
import { Skeleton } from './ui/skeleton';

interface MultipleMemberSelectorProps {
  selectedMemberIds: string[];
  onChange: (memberIds: string[]) => void;
  className?: string;
}

const MultipleMemberSelector = ({ 
  selectedMemberIds, 
  onChange, 
  className 
}: MultipleMemberSelectorProps) => {
  const { selectedFamily } = useExpense();
  const { members, isLoading } = useFamilyMembers(selectedFamily?.id);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      onChange(selectedMemberIds.filter(id => id !== memberId));
    } else {
      onChange([...selectedMemberIds, memberId]);
    }
  };

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!selectedFamily) {
    return (
      <div className={className}>
        <div className="flex items-center mb-2">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <label className="text-sm font-medium">Family Members</label>
        </div>
        <div className="border rounded-md p-4 text-center text-muted-foreground">
          Please select a family first
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <label className="text-sm font-medium">Family Members</label>
          </div>
          {selectedFamily && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDialogOpen(true)}
              className="h-8 px-2"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
        <div className="border rounded-md p-4 text-center text-muted-foreground">
          <p className="mb-2">No family members available</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Family Member
          </Button>
        </div>
        {selectedFamily && (
          <FamilyMemberFormDialog 
            open={dialogOpen} 
            onOpenChange={setDialogOpen} 
            familyId={selectedFamily.id} 
          />
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <label className="text-sm font-medium">Family Members</label>
        </div>
        {selectedFamily && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDialogOpen(true)}
            className="h-8 px-2"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>
      <div className="border rounded-md p-2">
        <ScrollArea className="h-32 pr-3">
          <div className="space-y-2">
            {members.map((member: FamilyMember) => (
              <div key={member.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`member-${member.id}`} 
                  checked={selectedMemberIds.includes(member.id)}
                  onCheckedChange={() => toggleMember(member.id)}
                />
                <label 
                  htmlFor={`member-${member.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {member.name}
                  <span className="ml-1 text-xs text-muted-foreground capitalize">({member.type})</span>
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      {selectedFamily && (
        <FamilyMemberFormDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          familyId={selectedFamily.id} 
        />
      )}
    </div>
  );
};

export default MultipleMemberSelector;
