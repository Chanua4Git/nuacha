
import { useEffect, useState } from 'react';
import { useExpenseMembers } from '@/hooks/useExpenseMembers';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, Plus, X } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

interface ExpenseMembersDisplayProps {
  expenseId: string;
  familyId: string;
}

const ExpenseMembersDisplay = ({ expenseId, familyId }: ExpenseMembersDisplayProps) => {
  const { members, isLoading, addMemberToExpense, removeMemberFromExpense } = useExpenseMembers(expenseId);
  const { members: allFamilyMembers, isLoading: isLoadingFamily } = useFamilyMembers(familyId);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  // Filter out members that are already associated with the expense
  const availableMembers = allFamilyMembers.filter(
    member => !members.some(m => m.id === member.id)
  );

  if (isLoading || isLoadingFamily) {
    return (
      <div className="mt-4">
        <div className="flex items-center mb-2">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    );
  }

  const handleAddMember = async (memberId: string) => {
    await addMemberToExpense(memberId);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm font-medium">Family Members</span>
        </div>
        
        {availableMembers.length > 0 && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2" align="end">
              <div className="mb-2 pb-2 border-b">
                <h4 className="text-sm font-medium">Add family member</h4>
              </div>
              {availableMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  All family members are already associated with this expense.
                </p>
              ) : (
                <ScrollArea className="h-48 pr-3">
                  <div className="space-y-2">
                    {availableMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{member.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">({member.type})</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2"
                          onClick={() => {
                            handleAddMember(member.id);
                            setPopoverOpen(false);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No family members associated with this expense yet.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {members.map(member => (
            <Badge 
              key={member.id} 
              variant="secondary"
              className="flex items-center gap-1 pr-1.5"
            >
              <span className="capitalize">{member.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full ml-1 hover:bg-secondary-foreground/10"
                onClick={() => removeMemberFromExpense(member.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseMembersDisplay;
