import { differenceInCalendarDays } from 'date-fns';
import { parseReceiptCalendarDate } from '@/utils/receipt/calendarDate';

/** A flag asks for confirmation; it never rewrites a historical purchase date. */
export function receiptDateConcern(date: string, savedAt?: string): string | null {
  const purchased = parseReceiptCalendarDate(date);
  if (!purchased) return 'Purchase date is missing or unreadable';
  if (!savedAt) return null;
  const saved = new Date(savedAt);
  if (isNaN(saved.getTime())) return null;
  const age = differenceInCalendarDays(saved, purchased);
  if (age < 0) return 'Purchase date is after the day this entry was saved';
  if (age > 365) return 'Purchase date is over a year before this entry was saved';
  return null;
}

export function pendingReviewGroups<T extends { id: string; created_at: string }>(
  groups: T[][], finished: string[], checked: string[],
): T[][] {
  return groups.filter(group => {
    const first = group[0];
    if (!first) return false;
    // New entries joining an old finished group must still be reviewed.
    return !finished.includes(first.id) || group.some(row => !checked.includes(row.id));
  });
}