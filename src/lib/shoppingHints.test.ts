import { describe, it, expect } from 'vitest';
import { dueHints } from './shoppingHints';
const l = (date: string) => ({ description: 'Pascual Yogurt 188ml', date, place: 'JTA' });
describe('dueHints', () => {
  it('flags an item once its usual gap has passed', () => {
    const h = dueHints([l('2026-10-01'), l('2026-10-08'), l('2026-10-15')], '2026-10-22');
    expect(h[0].avgGapDays).toBe(7);
  });
  it('does not flag before the usual gap', () => {
    expect(dueHints([l('2026-10-01'), l('2026-10-08'), l('2026-10-15')], '2026-10-20')).toHaveLength(0);
  });
  it('needs at least 3 separate shopping days', () => {
    expect(dueHints([l('2026-10-01'), l('2026-10-08')], '2026-12-01')).toHaveLength(0);
  });
});
