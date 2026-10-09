import { describe, it, expect, beforeEach } from 'vitest';
import { adjustScannedDate, learnFromSavedDate, rememberScannedDate, getStoreRule } from './storeDateFormats';

describe('store date memory', () => {
  beforeEach(() => localStorage.clear());

  it('learns Riaz prints day/month after the user corrects 10 Sep to 9 Oct', () => {
    rememberScannedDate('Riaz Supermarket', '2026-09-10');
    learnFromSavedDate('Riaz Supermarket', '2026-10-09');
    expect(getStoreRule('Riaz Supermarket')).toBe('swap');
    // Later bulk scan of an old Riaz receipt (3 Feb read as 2 Mar)
    expect(adjustScannedDate('RIAZ SUPERMARKET LTD', '2026-03-02', '2026-10-09').date).toBe('2026-02-03');
  });

  it('leaves stores without a rule alone when the date is in the past', () => {
    expect(adjustScannedDate('Massy', '2026-09-10', '2026-10-09').adjusted).toBe(false);
  });

  it('swaps a future date whose flip is not in the future', () => {
    expect(adjustScannedDate('Massy', '2026-11-09', '2026-10-09').date).toBe('2026-09-11');
  });

  it('never swaps when the day is above 12', () => {
    rememberScannedDate('Riaz', '2026-09-10');
    learnFromSavedDate('Riaz', '2026-10-09');
    expect(adjustScannedDate('Riaz', '2026-10-25', '2026-10-26').date).toBe('2026-10-25');
  });
});
