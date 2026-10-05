import { Receipt, Users, Calculator, Briefcase, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AppMapCounts {
  families: number;
  members: number;
  expenses: number;
  receipts: number;
  budgets: number;
  reminders: number;
  categories: number;
}

export interface AppMapItem {
  id: string;
  title: string;
  description: string;
  route: string;
  requiresSubscription?: boolean;
  isDone?: (c: AppMapCounts) => boolean;
}

export interface AppMapArea {
  id: string;
  title: string;
  icon: LucideIcon;
  learnModule: string;
  items: AppMapItem[];
}

export const APP_MAP: AppMapArea[] = [
  {
    id: 'receipts', title: 'Receipts', icon: Receipt, learnModule: 'first-receipt-scan',
    items: [
      { id: 'scan', title: 'Scan a receipt', description: 'Snap a photo and Nuacha fills in the details for you.', route: '/?action=scan', isDone: c => c.receipts > 0 },
      { id: 'manual', title: 'Add an expense by hand', description: 'For bank transfers and cash with no receipt.', route: '/app?tab=add-expense', isDone: c => c.expenses > 0 },
      { id: 'multipage', title: 'Scan long, multi-page receipts', description: 'Join several photos into one receipt.', route: '/?action=scan' },
      { id: 'unlimited', title: 'Unlimited scans every day', description: 'No daily limit — scan whenever it suits you.', route: '/get-started', requiresSubscription: true },
    ],
  },
  {
    id: 'family', title: 'Family & people', icon: Users, learnModule: 'setting-up-family',
    items: [
      { id: 'household', title: 'Set up a household', description: 'Keep each family’s spending in its own space.', route: '/options?tab=families', isDone: c => c.families > 0 },
      { id: 'members', title: 'Add family members', description: 'Add children, parents or helpers you spend for.', route: '/options?tab=families', isDone: c => c.members > 0 },
      { id: 'assign', title: 'Assign expenses to a person', description: 'See what each child or person costs over time.', route: '/app?tab=expenses' },
      { id: 'multifamily', title: 'Manage several families', description: 'Look after more than one household from one place.', route: '/get-started', requiresSubscription: true },
    ],
  },
  {
    id: 'budget', title: 'Budgeting', icon: Calculator, learnModule: 'building-budget',
    items: [
      { id: 'categories', title: 'Use detailed categories', description: 'Groceries, school, health and hundreds more.', route: '/options?tab=categories', isDone: c => c.categories > 10 },
      { id: 'reminders', title: 'Bill and replacement reminders', description: 'A gentle nudge before bills are due.', route: '/app?tab=reminders', isDone: c => c.reminders > 0 },
      { id: 'builder', title: 'Build a monthly budget', description: 'Plan spending and compare it with what really happened.', route: '/budget', requiresSubscription: true, isDone: c => c.budgets > 0 },
    ],
  },
  {
    id: 'payroll', title: '🇹🇹 Payroll & NIS', icon: Briefcase, learnModule: 'tnt-payroll',
    items: [
      { id: 'nis', title: 'Work out NIS for a helper', description: 'Employee and employer NIS, done for you.', route: '/payroll', requiresSubscription: true },
      { id: 'payslip', title: 'Send a payment receipt on WhatsApp', description: 'A tidy weekly pay note for your employee.', route: '/payroll', requiresSubscription: true },
      { id: 'history', title: 'Keep a full pay history', description: 'Cash or bank transfer, ready as a PDF when needed.', route: '/payroll', requiresSubscription: true },
    ],
  },
  {
    id: 'reports', title: 'Reports', icon: BarChart3, learnModule: 'generating-reports',
    items: [
      { id: 'view', title: 'See spending by month', description: 'A calm summary of where the money went.', route: '/reports', isDone: c => c.expenses >= 3 },
      { id: 'export', title: 'Download reports', description: 'Share a clean copy with family or your accountant.', route: '/reports', requiresSubscription: true },
    ],
  },
];

export const learnLink = (module: string) => `/updates?tab=learning&module=${module}`;

export function allMapItems() {
  return APP_MAP.flatMap(a => a.items.map(i => ({ ...i, area: a })));
}

/** Pick a not-yet-done, free item, rotating by day. */
export function pickSuggestion(counts: AppMapCounts | null, freeOnly = true) {
  const pool = allMapItems().filter(i => !(counts && i.isDone?.(counts)) && (!freeOnly || !i.requiresSubscription));
  if (!pool.length) return null;
  const day = Math.floor(Date.now() / 86400000);
  return pool[day % pool.length];
}
