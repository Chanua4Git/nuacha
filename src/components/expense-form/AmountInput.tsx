
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
}

const AmountInput = ({ value, onChange }: AmountInputProps) => {
  return (
    <div>
      <Label htmlFor="amount">Amount ($)</Label>
      <Input
        id="amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="mt-1"
      />
    </div>
  );
};

export default AmountInput;
