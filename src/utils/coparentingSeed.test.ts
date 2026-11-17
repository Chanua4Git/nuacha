import { describe, it, expect } from 'vitest';
import { parseSeed, labelToDate } from './coparentingSeed';
describe('history import', () => {
  it('reads every timeline line with phase, category and status', () => {
    const e = parseSeed();
    expect(e.length).toBeGreaterThan(60);
    expect(e[0]).toMatchObject({ event_date: '2019-09-18', category: 'Money', date_precision: 'exact' });
    expect(e.find(x => x.title.startsWith('Final consent orders'))?.category).toBe('Court & lawyers');
    expect(e.find(x => x.title.includes('Times and report numbers to confirm'))?.status).toBe('To confirm');
  });
  it('keeps ranges as ranges, not exact days', () => {
    expect(labelToDate('Feb–Sep 2020')).toEqual({ date: '2020-02-01', precision: 'range' });
  });
});
