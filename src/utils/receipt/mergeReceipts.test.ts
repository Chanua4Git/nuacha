import { describe, it, expect } from 'vitest';
import { combineLongReceipt } from './mergeReceipts';

const item = (description: string, totalPrice: string) => ({ description, totalPrice } as any);

describe('long receipt total', () => {
  it('uses the printed total from the bottom section, not a middle section amount', () => {
    const r = combineLongReceipt([
      { place: 'Riaz', amount: '40.00', lineItems: [item('Rice', '25.00'), item('Milk', '15.00')], confidence: 0.95 } as any,
      { amount: '30.00', lineItems: [item('Bread', '12.00'), item('Eggs', '18.00')], confidence: 0.99 } as any,
      { amount: '95.50', total: '95.50', paymentMethod: 'Linx', lineItems: [item('Soap', '25.50')], confidence: 0.6 } as any,
    ]);
    expect(r.amount).toBe('95.50');
    expect(r.itemsSum).toBe(95.5);
  });

  it('adds up all items when no section shows a printed total', () => {
    const r = combineLongReceipt([
      { place: 'Riaz', amount: '40.00', lineItems: [item('Rice', '25.00'), item('Milk', '15.00')] } as any,
      { amount: '30.00', lineItems: [item('Bread', '12.00'), item('Eggs', '18.00')] } as any,
    ]);
    expect(r.amount).toBe('70.00');
    expect(r.printedTotal).toBeNull();
  });

  it('counts an item that appears in two overlapping photos once', () => {
    const r = combineLongReceipt([
      { place: 'Riaz', lineItems: [item('Rice 2kg', '25.00'), item('Milk', '15.00')] } as any,
      { lineItems: [item('Milk', '15.00'), item('Bread', '12.00')] } as any,
    ]);
    expect(r.amount).toBe('52.00');
  });
});
