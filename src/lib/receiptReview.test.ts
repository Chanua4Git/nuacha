import { describe, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { receiptDateConcern, pendingReviewGroups } from './receiptReview';
import { groupBulkSaves } from './reviewBatch';

describe('saved scan review', () => {
  const hamburger = { id: 'hamburger', created_at: '2026-11-10T19:52:40Z' };
  it('keeps a single saved hamburger in review', () => {
    expect(groupBulkSaves([hamburger], undefined, true)).toEqual([[hamburger]]);
  });
  it('flags the actual 2024 hamburger date without changing it', () => {
    expect(receiptDateConcern('2024-01-01', hamburger.created_at)).toBe('Purchase date is over a year before this entry was saved');
  });
  it('flags missing, invalid and future dates', () => {
    expect(receiptDateConcern('', hamburger.created_at)).toBe('Purchase date is missing or unreadable');
    expect(receiptDateConcern('2026-02-30', hamburger.created_at)).toBe('Purchase date is missing or unreadable');
    expect(receiptDateConcern('2026-11-11', hamburger.created_at)).toBe('Purchase date is after the day this entry was saved');
  });
  it('accepts a confirmed normal purchase day', () => {
    expect(receiptDateConcern('2026-11-10', hamburger.created_at)).toBeNull();
  });
  it('does not expire an unchecked single scan after thirty days', () => {
    const old = { id: 'old', created_at: '2026-09-01T12:00:00Z' };
    expect(pendingReviewGroups(groupBulkSaves([old, hamburger], undefined, true), [], [])).toEqual([[hamburger], [old]]);
  });
  it('keeps bulk groups together and restores one when an unchecked entry joins', () => {
    const first = { id: 'first', created_at: '2026-11-10T19:51:00Z' };
    const groups = groupBulkSaves([first, hamburger], undefined, true);
    expect(groups).toEqual([[first, hamburger]]);
    expect(pendingReviewGroups(groups, ['first'], ['first'])).toEqual(groups);
    expect(pendingReviewGroups(groups, ['first'], ['first', 'hamburger'])).toEqual([]);
  });
});