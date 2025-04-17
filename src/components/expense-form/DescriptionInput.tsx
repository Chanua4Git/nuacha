
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DescriptionInput = ({ value, onChange }: DescriptionInputProps) => {
  return (
    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        placeholder="What was this expense for?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1"
      />
    </div>
  );
};

export default DescriptionInput;
