
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { Users, Plus } from 'lucide-react';
import { Dispatch, SetStateAction, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from './ui/button';
import { toast } from 'sonner';
import FamilyFormDialog from './FamilyFormDialog';

interface FamilySelectorProps {
  onFamilyChange?: Dispatch<SetStateAction<string>>;
}

const FamilySelector = ({ onFamilyChange }: FamilySelectorProps) => {
  const { families, selectedFamily, setSelectedFamily, isLoading } = useExpense();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center mb-2">
          <Skeleton className="h-5 w-5 mr-2 rounded-full" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="p-4 bg-accent/30 rounded-lg">
        <div className="flex items-center mb-2">
          <Users className="h-5 w-5 mr-2 text-muted-foreground" />
          <h2 className="text-lg font-medium">No Families</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          When you're ready, you can add your first family to start tracking expenses.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Family
        </Button>
        
        <FamilyFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-muted-foreground" />
          <h2 className="text-lg font-medium">Select Family</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Family
        </Button>
      </div>
      <Select
        value={selectedFamily?.id || ''}
        onValueChange={(value) => {
          const family = families.find(f => f.id === value);
          setSelectedFamily(family || null);
          
          // Call the optional onFamilyChange prop if provided
          if (onFamilyChange) {
            onFamilyChange(value);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a family" />
        </SelectTrigger>
        <SelectContent className="z-50">
          {families.map((family) => (
            <SelectItem 
              key={family.id} 
              value={family.id}
              className="flex items-center"
            >
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: family.color }}
                />
                {family.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <FamilyFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default FamilySelector;
