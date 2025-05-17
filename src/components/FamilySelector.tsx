
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { Users } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface FamilySelectorProps {
  onFamilyChange?: Dispatch<SetStateAction<string>>;
}

const FamilySelector = ({ onFamilyChange }: FamilySelectorProps) => {
  const { families, selectedFamily, setSelectedFamily, isLoading } = useExpense();

  if (isLoading) {
    return (
      <div className="mb-6">
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
      <div className="mb-6 p-4 bg-accent/30 rounded-lg">
        <div className="flex items-center mb-2">
          <Users className="h-5 w-5 mr-2 text-muted-foreground" />
          <h2 className="text-lg font-medium">No Families</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          When you're ready, you can add your first family to start tracking expenses.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <Users className="h-5 w-5 mr-2 text-muted-foreground" />
        <h2 className="text-lg font-medium">Select Family</h2>
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
        <SelectContent>
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
    </div>
  );
};

export default FamilySelector;
