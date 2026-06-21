import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { buildWhatsAppUrl, formatPayslipText, normaliseWhatsAppPhone } from '@/lib/payslip';
import type { Employee } from '@/types/payroll';
import type { HistoryEntry } from '@/hooks/useEmployeePayrollHistory';
import { useEmployerSettings } from '@/hooks/useEmployerSettings';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  entries: HistoryEntry[];
  onPhoneSaved?: (phone: string) => void;
  onSaved?: () => void;
  readOnly?: boolean;
  initialText?: string;
}

export const PayslipDialog: React.FC<Props> = ({ open, onOpenChange, employee, entries, onPhoneSaved, onSaved, readOnly, initialText }) => {
  const { toast } = useToast();
  const { settings } = useEmployerSettings();
  const [phone, setPhone] = useState(employee.phone || '');
  const [savePhone, setSavePhone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone(employee.phone || '');
      setSavePhone(false);
      setCopied(false);
    }
  }, [open, employee.phone]);

  const text = useMemo(
    () =>
      initialText ||
      formatPayslipText(entries, employee, { employerName: settings?.trade_name || undefined }),
    [entries, employee, settings?.trade_name, initialText]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  };

  const persistPayslip = async (phoneToStore: string) => {
    if (readOnly || !entries.length) return;
    const totals = entries.reduce(
      (acc, e) => {
        acc.days += e.days_worked;
        acc.gross += e.gross_pay;
        acc.nisEmp += e.nis_employee_contribution;
        return acc;
      },
      { days: 0, gross: 0, nisEmp: 0 }
    );
    const sorted = [...entries].sort((a, b) =>
      (a.week_start_date || '').localeCompare(b.week_start_date || '')
    );
    const periodStart = sorted[0]?.week_start_date || null;
    const periodEnd = sorted[sorted.length - 1]?.week_end_date || null;

    const { data: userResult } = await supabase.auth.getUser();
    const userId = userResult.user?.id;
    if (!userId) return;

    const { error } = await supabase.from('payslips').insert({
      user_id: userId,
      employee_id: employee.id,
      phone_sent_to: phoneToStore || null,
      period_start: periodStart,
      period_end: periodEnd,
      entry_ids: entries.map((e) => e.id),
      days_total: totals.days,
      gross_total: totals.gross,
      nis_employee_total: totals.nisEmp,
      net_total: totals.gross - totals.nisEmp,
      payslip_text: text,
    });
    if (error) {
      console.error('payslip save error', error);
      toast({ title: 'Could not save payslip to history', description: error.message, variant: 'destructive' });
    } else {
      onSaved?.();
    }
  };

  const handleSend = async () => {
    const normalised = normaliseWhatsAppPhone(phone);
    if (!normalised) {
      toast({ title: 'Phone number required', description: 'Add a number to send via WhatsApp.', variant: 'destructive' });
      return;
    }
    setSending(true);
    if (savePhone && phone.trim() !== (employee.phone || '')) {
      setSavingPhone(true);
      const { error } = await supabase
        .from('employees')
        .update({ phone: phone.trim() || null })
        .eq('id', employee.id);
      setSavingPhone(false);
      if (error) {
        toast({ title: 'Could not save phone', description: error.message, variant: 'destructive' });
      } else {
        onPhoneSaved?.(phone.trim());
      }
    }
    await persistPayslip(phone.trim());
    const url = buildWhatsAppUrl(phone, text);
    window.open(url, '_blank', 'noopener,noreferrer');
    setSending(false);
    if (!readOnly) {
      toast({ title: 'Payslip saved & opened in WhatsApp' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send payslip to {employee.first_name}</DialogTitle>
          <DialogDescription>
            Opens WhatsApp Web or the app with the message pre-filled. Nothing is sent automatically — you tap send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payslip-phone">Phone number</Label>
            <Input
              id="payslip-phone"
              type="tel"
              placeholder="e.g. 868-555-1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              T&amp;T numbers get +1 868 added automatically.
            </p>
          </div>

          {phone.trim() !== (employee.phone || '') && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="save-phone"
                checked={savePhone}
                onCheckedChange={(c) => setSavePhone(c === true)}
              />
              <Label htmlFor="save-phone" className="text-sm font-normal cursor-pointer">
                Save this number to {employee.first_name}'s profile
              </Label>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="payslip-text">Payslip preview</Label>
            <Textarea
              id="payslip-text"
              value={text}
              readOnly
              rows={12}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Copied' : 'Copy text'}
          </Button>
          <Button onClick={handleSend} disabled={savingPhone || sending}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {readOnly ? 'Re-send via WhatsApp' : 'Send via WhatsApp'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
