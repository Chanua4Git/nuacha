import { z } from 'zod';

export const invitedEmailSchema = z.string().trim().email().max(254).transform(value => value.toLowerCase());
export const coParentingTabs = (readOnly: boolean) => readOnly
  ? ['timeline']
  : ['timeline', 'access', 'maintenance', 'summary', 'sharing'];