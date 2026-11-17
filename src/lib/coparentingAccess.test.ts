import { describe, expect, it } from 'vitest';
import { coParentingTabs, coParentingSection, invitedEmailSchema } from './coparentingAccess';

describe('co-parenting invitations', () => {
  it('opens the welcome page unless a valid section is explicitly selected', () => {
    expect(coParentingSection(null)).toBeNull();
    expect(coParentingSection('unknown')).toBeNull();
    expect(coParentingSection('timeline')).toBe('timeline');
    expect(coParentingSection('setup')).toBe('setup');
  });
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