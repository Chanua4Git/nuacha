import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  PaidFromOptions, PaidFromValue, describePaidFrom, getPaidFrom, loadPaidFromOptions, setPaidFrom,
} from '@/lib/paidFrom';

const TT = (n: number) => `TT$${Number(n).toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

let cache: Promise<PaidFromOptions> | null = null;
export const usePaidFromOptions = () => {
  const [opts, setOpts] = useState<PaidFromOptions | null>(null);
  useEffect(() => {
    if (!cache) cache = loadPaidFromOptions();
    cache.then(setOpts).catch(() => { cache = null; });
  }, []);
  return opts;
};

interface SelectProps {
  value: PaidFromValue;
  onChange: (v: PaidFromValue) => void;
  options?: PaidFromOptions | null;
  className?: string;
}

/** Controlled picker: accounts (paid straight from) and cash pots (withdrawals). */
export const PaidFromSelect: React.FC<SelectProps> = ({ value, onChange, options, className }) => {
  const loaded = usePaidFromOptions();
  const opts = options ?? loaded;
  return (
    <Select value={value ?? 'none'} onValueChange={(v) => onChange(v === 'none' ? null : v)}>
      <SelectTrigger className={className}><SelectValue placeholder="Not set yet" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Not set yet</SelectItem>
        {opts && opts.withdrawals.length > 0 && (
          <SelectGroup>
            <SelectLabel>Cash in hand (from a withdrawal)</SelectLabel>
            {opts.withdrawals.map((w) => {
              const acct = opts.accounts.find((a) => a.id === w.account_id);
              return (
                <SelectItem key={w.id} value={`wd:${w.id}`}>
                  {acct?.name ?? 'Cash'} · {TT(w.amount)} on {w.withdrawn_on}{w.purpose ? ` · ${w.purpose}` : ''}
                </SelectItem>
              );
            })}
          </SelectGroup>
        )}
        {opts && (
          <SelectGroup>
            <SelectLabel>Paid straight from account</SelectLabel>
            {opts.accounts.map((a) => (
              <SelectItem key={a.id} value={`acct:${a.id}`}>
                {a.name}{a.account_last4 ? ` •••• ${a.account_last4}` : ''}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
};

interface BadgeProps {
  expenseId?: string;
  payrollEntryId?: string;
  amount: number;
  className?: string;
}

/** Shows where an expense/wage was paid from; tap to change. Saves immediately. */
export const PaidFromBadge: React.FC<BadgeProps> = ({ expenseId, payrollEntryId, amount, className }) => {
  const opts = usePaidFromOptions();
  const [value, setValue] = useState<PaidFromValue>(null);
  const [open, setOpen] = useState(false);
  const target = { expenseId, payrollEntryId };

  useEffect(() => {
    getPaidFrom(target).then(setValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseId, payrollEntryId]);

  const change = async (v: PaidFromValue) => {
    const prev = value;
    setValue(v);
    try {
      await setPaidFrom(target, amount, v, opts ?? undefined);
      toast.success(v ? 'Saved where this was paid from' : 'Cleared');
      setOpen(false);
    } catch (e: any) {
      setValue(prev);
      toast.error('Could not save that just now', { description: e?.message });
    }
  };

  const label = describePaidFrom(value, opts);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs max-w-full',
            label ? 'border-primary/30 bg-primary/10 text-primary' : 'border-dashed text-muted-foreground',
            className,
          )}
          title="Where was this paid from?"
        >
          <Wallet className="h-3 w-3 shrink-0" />
          <span className="truncate">{label ?? 'Paid from?'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2">
        <p className="text-sm font-medium">Where did this money come from?</p>
        <PaidFromSelect value={value} onChange={change} options={opts} />
      </PopoverContent>
    </Popover>
  );
};
