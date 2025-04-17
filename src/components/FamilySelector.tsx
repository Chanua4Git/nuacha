
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useExpense } from '@/context/ExpenseContext';
import { users } from 'lucide-react';

const FamilySelector = () => {
  const { families, selectedFamily, setSelectedFamily } = useExpense();

  return (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <users className="h-5 w-5 mr-2 text-muted-foreground" />
        <h2 className="text-lg font-medium">Select Family</h2>
      </div>
      <Select
        value={selectedFamily?.id || ''}
        onValueChange={(value) => {
          const family = families.find(f => f.id === value);
          setSelectedFamily(family || null);
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
