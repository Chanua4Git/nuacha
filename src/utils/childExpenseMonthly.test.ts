import { describe, it, expect } from 'vitest';
import { monthlyEvidence, EvidenceRow } from './childExpenseEvidence';
const row = (id: string, date: string, amount: number): EvidenceRow => ({ id, expenseId: id, date, place: 'x', description: 'x', amount, bucket: 'Health & dental', reason: '', assigned: false, allocatedAmount: 0 });
describe('month-by-month child costs', () => {
  it('totals only reviewed shares per month and compares with TT$250/week', () => {
    const rows = [row('a', '2026-11-13', 1500), row('b', '2026-11-20', 100), row('c', '2026-10-02', 80)];
    const m = monthlyEvidence(rows, { a: { included: true, amount: 1500, bucket: '', note: '' }, c: { included: true, amount: 40, bucket: '', note: '' } }, '2026-10-01', '2026-11-30', 250);
    expect(m).toHaveLength(2);
    expect(m[0]).toMatchObject({ month: '2026-10', total: 40, orderDue: 1107.14 });
    expect(m[1]).toMatchObject({ month: '2026-11', total: 1500, orderDue: 1071.43, gap: 428.57 });
  });
});
