import { describe, it, expect } from 'vitest';
import { findExistingMatch } from './statementMatch';

describe('statement duplicate matching', () => {
  const saved = [{ id: 'a', amount: 103.13, date: '2026-10-07' }];
  it('treats same amount posted 2 days later as already saved', () => {
    expect(findExistingMatch({ amount: 103.13, date: '2026-10-09' }, saved)?.id).toBe('a');
  });
  it('does not match a different amount', () => {
    expect(findExistingMatch({ amount: 103.14, date: '2026-10-07' }, saved)).toBeUndefined();
  });
  it('does not match the same amount weeks apart', () => {
    expect(findExistingMatch({ amount: 103.13, date: '2026-11-07' }, saved)).toBeUndefined();
  });
});
