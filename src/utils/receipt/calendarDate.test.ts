import { describe, it, expect } from 'vitest';
import { parseReceiptCalendarDate, receiptDateString } from './calendarDate';

// Tests run with TZ=America/Port_of_Spain (UTC-4), see vitest.config.ts.
describe('receipt calendar dates never shift a day', () => {
  it('runs in Trinidad time', () => {
    expect(new Date(2026, 9, 8).getTimezoneOffset()).toBe(240);
  });

  it('plain YYYY-MM-DD stays the same day', () => {
    expect(receiptDateString('2026-10-08')).toBe('2026-10-08');
  });

  it('UTC-midnight timestamp keeps the printed day, not the day before', () => {
    expect(receiptDateString('2026-10-08T00:00:00.000Z')).toBe('2026-10-08');
  });

  it('late-night UTC timestamp keeps the printed day', () => {
    expect(receiptDateString('2026-10-08T23:30:00.000Z')).toBe('2026-10-08');
  });

  it('DD/MM/YYYY is read Trinidad-style (8/10/2026 is 8 October)', () => {
    expect(receiptDateString('8/10/2026')).toBe('2026-10-08');
  });

  it('{ value } objects from the receipt reader work too', () => {
    expect(receiptDateString({ value: '2026-10-08T00:00:00Z' })).toBe('2026-10-08');
  });

  it('returns the local calendar day as a Date', () => {
    const d = parseReceiptCalendarDate('2026-10-08T00:00:00Z')!;
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 10, 8]);
  });
});
