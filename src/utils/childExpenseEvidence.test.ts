import { describe, it, expect } from 'vitest';
import { buildEvidenceRows, evidenceSummary, evidenceHint, EvidenceExpense } from './childExpenseEvidence';
import { relevantServiceCategory } from './receipt/relevantCategory';
const dental: EvidenceExpense = { id: 'receipt', date: '2026-11-13', place: 'KIDDIE CARE DENTAL LTD', description: 'Dental Service Dr. Maharaj', amount: 1500, category: 'doctor', receipt_line_items: [{ id: 'line', description: 'Dental Service Dr. Maharaj', total_price: 1500, member_id: null, category_id: null }], expense_members: [] };
describe('receipt evidence and child attribution', () => {
  it('suggests Dental, not popular groceries or subscriptions, for the TT$1500 receipt', () => {
    expect(relevantServiceCategory(dental.place, dental.receipt_line_items, [{id:'g',name:'Groceries'},{id:'s',name:'Subscriptions'},{id:'d',name:'Dental'},{id:'dr',name:'Doctor visits'}])?.category.id).toBe('d');
  });
  it('falls back to Doctor visits when no dental category is available', () => {
    expect(relevantServiceCategory(dental.place, dental.receipt_line_items, [{id:'g',name:'Groceries'},{id:'dr',name:'Doctor visits'}])?.category.id).toBe('dr');
  });
  it('does not assume a paediatric provider proves ZI was the patient', () => {
    const rows = buildEvidenceRows([dental], 'ZI', {});
    expect(rows[0].allocatedAmount).toBe(0);
    expect(evidenceSummary(rows, {}, '2026-11-01','2026-11-30',250).total).toBe(0);
  });
  it('never counts both line items and their parent receipt', () => {
    const rows = buildEvidenceRows([dental], 'ZI', {});
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(1500);
  });
  it('counts only the reviewed child share, not the whole household purchase', () => {
    const rows = buildEvidenceRows([dental], 'ZI', {});
    expect(evidenceSummary(rows, {'line:line':{included:true,amount:300,bucket:'Health & dental',note:'Share confirmed'}},'2026-11-01','2026-11-30',250).total).toBe(300);
  });
  it('converts the stated TT$250 weekly order to TT$1083.33 monthly, not TT$1000', () => {
    expect(evidenceSummary([],{},'2026-11-01','2026-11-30',250).orderMonthly).toBeCloseTo(1083.333333,5);
  });
  it('excludes an item assigned to another person from inherited child allocation', () => {
    const e = {...dental, expense_members:[{member_id:'ZI',allocation_percentage:50}], receipt_line_items:[{...dental.receipt_line_items[0], member_id:'adult'}]};
    expect(buildEvidenceRows([e],'ZI',{})[0].allocatedAmount).toBe(0);
  });
  it('does not treat adult diapers or nursing as child-specific', () => {
    expect(evidenceHint('adult diapers nurse').bucket).toBe('Other');
  });
  it('reconciles overstated item sums to the original receipt total', () => {
    const e = {...dental,receipt_line_items:[{...dental.receipt_line_items[0],total_price:1800}]};
    const rows = buildEvidenceRows([e],'ZI',{});
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(1500);
    expect(rows[0].allocatedAmount).toBe(0);
  });
  it('does not include an amount above the source amount', () => {
    const rows = buildEvidenceRows([dental],'ZI',{});
    expect(evidenceSummary(rows,{'line:line':{included:true,amount:1501,bucket:'Health & dental',note:''}},'2026-11-01','2026-11-30',250).total).toBe(0);
  });
  it('keeps an unitemised remainder separate and unassigned', () => {
    const e = {...dental,amount:1600};
    const rows = buildEvidenceRows([e],'ZI',{});
    expect(rows).toHaveLength(2);
    expect(rows[1].amount).toBe(100);
    expect(rows[1].allocatedAmount).toBe(0);
  });
});