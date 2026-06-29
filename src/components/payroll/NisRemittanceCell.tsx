import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { useNisRemittance } from '@/hooks/useNisRemittance';

interface Props {
  employeeId: string;
  periodMonth: string; // YYYY-MM-01
  totalNis: number;
}

export const NisRemittanceCell: React.FC<Props> = ({ employeeId, periodMonth, totalNis }) => {
  const { data, save } = useNisRemittance(employeeId, periodMonth, totalNis);
  const [code, setCode] = useState(data.nib_transaction_code || '');
  const [date, setDate] = useState(data.paid_on_date || '');
  const [saved, setSaved] = useState<null | 'date' | 'code' | 'chk'>(null);

  React.useEffect(() => {
    setCode(data.nib_transaction_code || '');
    setDate(data.paid_on_date || '');
  }, [data.nib_transaction_code, data.paid_on_date]);

  const flash = (k: 'date' | 'code' | 'chk') => {
    setSaved(k);
    setTimeout(() => setSaved((s) => (s === k ? null : s)), 1200);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-normal">
      <div className="flex items-center gap-1">
        <Label className="text-muted-foreground">NIB paid</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onBlur={async () => {
            if ((data.paid_on_date || '') !== date) {
              await save({ paid_on_date: date || null });
              flash('date');
            }
          }}
          className="h-7 w-[130px] text-xs"
        />
        {saved === 'date' && <Check className="h-3 w-3 text-green-600" />}
      </div>
      <div className="flex items-center gap-1">
        <Label className="text-muted-foreground">Txn</Label>
        <Input
          type="text"
          placeholder="Ref #"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={async () => {
            if ((data.nib_transaction_code || '') !== code) {
              await save({ nib_transaction_code: code.trim() || null });
              flash('code');
            }
          }}
          className="h-7 w-[110px] text-xs"
        />
        {saved === 'code' && <Check className="h-3 w-3 text-green-600" />}
      </div>
      <label className="flex items-center gap-1 cursor-pointer">
        <Checkbox
          checked={data.ni184_submitted}
          onCheckedChange={async (c) => {
            await save({
              ni184_submitted: c === true,
              ni184_submitted_at: c === true ? new Date().toISOString() : null,
            });
            flash('chk');
          }}
        />
        <span className="text-muted-foreground">NI 184 submitted</span>
        {saved === 'chk' && <Check className="h-3 w-3 text-green-600" />}
      </label>
    </div>
  );
};
