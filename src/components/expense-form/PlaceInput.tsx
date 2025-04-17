
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PlaceInputProps {
  value: string;
  onChange: (value: string) => void;
}

const PlaceInput = ({ value, onChange }: PlaceInputProps) => {
  return (
    <div>
      <Label htmlFor="place">Place</Label>
      <Input
        id="place"
        placeholder="Where was this expense made?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1"
      />
    </div>
  );
};

export default PlaceInput;
