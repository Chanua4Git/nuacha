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

  it('keeps genuine repeated lines like 4 × Red Pear', () => {
    const r = combineLongReceipt([
      { place: 'JTA', amount: '31.96', lineItems: [item('RED PEAR', '7.99'), item('RED PEAR', '7.99'), item('RED PEAR', '7.99'), item('RED PEAR', '7.99')] } as any,
    ]);
    expect(r.lineItems).toHaveLength(4);
    expect(r.itemsSum).toBe(31.96);
  });

  it('uses the printed total from a single full-receipt photo even if items were missed', () => {
    const r = combineLongReceipt([
      { place: 'JTA', amount: '863.20', lineItems: [item('Broccoli', '21.24'), item('Kiwi', '26.40')] } as any,
    ]);
    expect(r.amount).toBe('863.20');
  });

  it('drops only the overlapping run between two photos', () => {
    const r = combineLongReceipt([
      { place: 'JTA', lineItems: [item('Flour', '16.99'), item('Eggs', '27.99'), item('Banana', '9.31'), item('Red pear', '7.99')] } as any,
      { lineItems: [item('Banana', '9.31'), item('Red pear', '7.99'), item('Red pear', '7.99'), item('Oats', '46.99')] } as any,
    ]);
    expect(r.lineItems).toHaveLength(6);
    expect(r.amount).toBe('117.26');
  });
});
