
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface ReplacementSectionProps {
  needsReplacement: boolean;
  replacementFrequency: string;
  onNeedsReplacementChange: (value: boolean) => void;
  onFrequencyChange: (value: string) => void;
}

const ReplacementSection = ({
  needsReplacement,
  replacementFrequency,
  onNeedsReplacementChange,
  onFrequencyChange,
}: ReplacementSectionProps) => {
  return (
    <div className="space-y-4 pt-2 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="needs-replacement">Needs Replacement</Label>
          <p className="text-sm text-muted-foreground">
            Will this item need to be replaced in the future?
          </p>
        </div>
        <Switch
          id="needs-replacement"
          checked={needsReplacement}
          onCheckedChange={onNeedsReplacementChange}
        />
      </div>
      
      {needsReplacement && (
        <div>
          <Label htmlFor="replacement-frequency">Replacement Frequency (days)</Label>
          <Input
            id="replacement-frequency"
            type="number"
            placeholder="e.g., 30, 90, 180"
            value={replacementFrequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
};

export default ReplacementSection;
