import { describe, expect, it } from 'vitest';
import { coParentingTabs, invitedEmailSchema } from './coparentingAccess';

describe('co-parenting invitations', () => {
  it('allows invited viewers only the timeline', () => {
    expect(coParentingTabs(true)).toEqual(['timeline']);
  });
  it('retains all owner sections', () => {
    expect(coParentingTabs(false)).toEqual(['timeline', 'access', 'maintenance', 'summary', 'sharing']);
  });
  it('validates and normalizes the invited email', () => {
    expect(invitedEmailSchema.parse(' Brother@example.com ')).toBe('brother@example.com');
    expect(invitedEmailSchema.safeParse('not an email').success).toBe(false);
  });
});