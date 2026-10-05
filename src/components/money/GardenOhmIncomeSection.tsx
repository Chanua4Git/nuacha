import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Sprout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BusinessIncomeRow, IncomeChannel } from '@/hooks/useBusinessIncome';
import type { MoneyAccount } from '@/hooks/useMoneyPots';

const tt = (n: number) => `TT$${n.toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  rows: BusinessIncomeRow[];
  monthStart: string;
  monthEnd: string;
  accounts: MoneyAccount[];
  onSetChannel: (id: string, channel: IncomeChannel, accountId: string | null) => void;
}

const GardenOhmIncomeSection = ({ rows, monthStart, monthEnd, accounts, onSetChannel }: Props) => {
  const [showAll, setShowAll] = useState(false);
  const cashAcct = accounts.find((a) => /garden ohm cash/i.test(a.name));
  const bankAcct = accounts.find((a) => /business.*garden ohm/i.test(a.name));

  const month = useMemo(() => rows.filter((r) => r.delivered_on && r.delivered_on >= monthStart && r.delivered_on <= monthEnd), [rows, monthStart, monthEnd]);
  const year = monthStart.slice(0, 4);
  const yearTotal = useMemo(() => rows.filter((r) => r.delivered_on?.startsWith(year)).reduce((s, r) => s + r.amount, 0), [rows, year]);
  const sum = (c: IncomeChannel) => month.filter((r) => r.channel === c).reduce((s, r) => s + r.amount, 0);

  if (rows.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Sprout className="h-5 w-5 text-primary" /> Garden Ohm money in</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No delivered orders have come through yet. Once Garden Ohm is connected, they'll appear here on their own.</p></CardContent>
      </Card>
    );
  }

  const list = showAll ? month : month.slice(0, 8);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2"><Sprout className="h-5 w-5 text-primary" /> Garden Ohm money in</CardTitle>
        <p className="text-sm text-muted-foreground">Delivered orders, {format(parseISO(monthStart), 'MMMM yyyy')} · {year} so far {tt(yearTotal)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['This month', month.reduce((s, r) => s + r.amount, 0)],
            ['Cash', sum('cash')],
            ['Bank', sum('bank')],
            ['Not sure yet', sum('unknown')],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium text-foreground">{tt(value as number)}</p>
            </div>
          ))}
        </div>

        {month.length === 0 ? (
          <p className="text-sm text-muted-foreground">No delivered orders this month — and that's okay.</p>
        ) : (
          <ul className="divide-y">
            {list.map((r) => (
              <li key={r.id} className="py-2 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-foreground break-words">
                    {r.order_number ? `#${r.order_number}` : 'Order'}{r.customer_name ? ` · ${r.customer_name}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.delivered_on ? format(parseISO(r.delivered_on), 'd MMM yyyy') : 'No date'}{r.payment_method_raw ? ` · ${r.payment_method_raw}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-foreground">{tt(r.amount)}</span>
                  <Select
                    value={r.channel}
                    onValueChange={(v) => {
                      const c = v as IncomeChannel;
                      onSetChannel(r.id, c, c === 'cash' ? cashAcct?.id ?? null : c === 'bank' ? bankAcct?.id ?? null : null);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="unknown">Not sure yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        )}
        {month.length > 8 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
            {showAll ? 'Show fewer' : `Show all ${month.length}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GardenOhmIncomeSection;
