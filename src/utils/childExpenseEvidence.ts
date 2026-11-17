import { parseReceiptCalendarDate } from '@/utils/receipt/calendarDate';
import { differenceInCalendarDays } from 'date-fns';

export type EvidenceDecision = { included: boolean; amount: number; bucket: string; note: string };
export type EvidenceRow = { id: string; expenseId: string; lineId?: string; date: string; place: string; description: string; amount: number; bucket: string; reason: string; assigned: boolean; allocatedAmount: number };
export type EvidenceExpense = {
  id: string; date: string; place: string; description: string; amount: number; category: string; receipt_url?: string | null; receipt_image_url?: string | null;
  receipt_line_items: { id: string; description: string; total_price: number; member_id: string | null; category_id: string | null }[];
  expense_members: { member_id: string; allocation_percentage: number | null }[];
};
export function evidenceHint(text: string): { bucket: string; reason: string } {
  if (/dental|dentist|doctor|medical|optical|prescription/i.test(text)) return { bucket: 'Health & dental', reason: 'Health service; confirm the patient' };
  if (/school|tuition|uniform|stationery|exercise book|textbook/i.test(text)) return { bucket: 'Education', reason: 'Education item; confirm who uses it' };
  if (/childcare|daycare|nursery|summer camp|swim|gymnast|football/i.test(text)) return { bucket: 'Childcare & activities', reason: 'Care or activity; confirm the child' };
  if (/adult|elderly|nurse|incontinence/i.test(text)) return { bucket: 'Other', reason: 'May be adult care, not a child expense' };
  if (/kids|child|toy|huggies|pampers|baby/i.test(text)) return { bucket: 'Clothing & personal care', reason: 'Child-related wording; confirm beneficiary' };
  if (/grocer|milk|bread|rice|oats|food|supermarket/i.test(text)) return { bucket: 'Food', reason: 'Shared household purchase; enter only the child’s share' };
  if (/electric|water|rent|internet|utility/i.test(text)) return { bucket: 'Housing & utilities', reason: 'Shared household cost; explain the child’s share' };
  if (/transport|taxi|fuel|travel/i.test(text)) return { bucket: 'Transport', reason: 'Confirm child-related travel and share' };
  return { bucket: 'Other', reason: 'No child attribution recorded; review before including' };
}
export function buildEvidenceRows(expenses: EvidenceExpense[], memberId: string, categoryNames: Record<string, string>): EvidenceRow[] {
  return expenses.flatMap(e => {
    const allocations = e.expense_members || [];
    const allocation = allocations.find(a => a.member_id === memberId);
    // Missing percentages do not establish a defensible share, even with one assignee.
    const ratio = allocation?.allocation_percentage == null ? 0 : Math.max(0, Math.min(100, Number(allocation.allocation_percentage))) / 100;
    const lines = (e.receipt_line_items || []).filter(l => Number(l.total_price) > 0);
    const make = (id: string, description: string, amount: number, lineId?: string, assigned = false, categoryId = e.category): EvidenceRow => {
      const hint = evidenceHint(`${description} ${e.place} ${categoryNames[categoryId] || ''}`);
      return { id, expenseId: e.id, lineId, date: e.date, place: e.place, description, amount, ...hint, assigned,
        allocatedAmount: assigned ? amount : amount * ratio,
        reason: assigned ? 'Receipt item assigned to this person' : allocation ? (ratio > 0 ? `Expense allocation: ${(ratio * 100).toFixed(0)}% (check item-level shares)` : 'Person linked, but no share recorded') : hint.reason };
    };
    if (!lines.length) return [make(`expense:${e.id}`, e.description, Number(e.amount))];
    const sum = lines.reduce((s, l) => s + Number(l.total_price), 0);
    // Overstated item sums need reconciliation; never silently inflate a receipt.
    if (sum > Number(e.amount) + 0.01) return [{ ...make(`expense:${e.id}`, e.description, Number(e.amount)), reason: 'Item totals exceed receipt total; reconcile the receipt first' }];
    const rows = lines.map(l => {
      const row = make(`line:${l.id}`, l.description, Number(l.total_price), l.id, l.member_id === memberId, l.category_id || e.category);
      // A line explicitly belonging to someone else must not inherit a whole-receipt allocation.
      if (l.member_id && l.member_id !== memberId) return { ...row, allocatedAmount: 0, reason: 'Item assigned to another household member' };
      return row;
    });
    const residual = Math.round((Number(e.amount) - sum) * 100) / 100;
    if (residual > 0) rows.push({ ...make(`remainder:${e.id}`, 'Receipt remainder (tax, fees or missing items)', residual), allocatedAmount: 0, reason: 'Unitemised remainder; review separately' });
    return rows;
  });
}
export function evidenceSummary(rows: EvidenceRow[], decisions: Record<string, EvidenceDecision>, start: string, end: string, weeklyOrder: number) {
  const from = parseReceiptCalendarDate(start), to = parseReceiptCalendarDate(end);
  const days = from && to ? differenceInCalendarDays(to, from) + 1 : 0;
  if (days <= 0) return { total: 0, weekly: 0, monthly: 0, orderMonthly: weeklyOrder * 52 / 12, days: 0 };
  const total = rows.filter(r => r.date >= start && r.date <= end).reduce((sum, r) => {
    const d = decisions[r.id];
    return sum + (d?.included && Number.isFinite(d.amount) && d.amount >= 0 && d.amount <= r.amount ? d.amount : 0);
  }, 0);
  const weekly = total / days * 7;
  return { total, weekly, monthly: weekly * 52 / 12, orderMonthly: weeklyOrder * 52 / 12, days };
}