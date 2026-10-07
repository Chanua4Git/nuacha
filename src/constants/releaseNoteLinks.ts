import type { ReleaseNote } from '@/types/updates';

export interface ReleaseNoteLink {
  label: string;
  path: string;
}

const match = (title: string, terms: string[]) => terms.some((term) => title.includes(term));

export function getReleaseNoteLink(note: ReleaseNote): ReleaseNoteLink {
  const title = note.title.toLowerCase();

  if (match(title, ['setup with chan', 'booking'])) return { label: 'Choose your setup and date', path: '/setup?section=calendar#setup-calendar' };
  if (match(title, ['prompts made for you', 'talk it through', 'talk-it-through', 'talk', 'voice', 'check-in', 'check in'])) return { label: 'Try Talk it through', path: '/?talk=true' };
  if (match(title, ['learning lesson', 'developer updates'])) return { label: 'Explore the lessons', path: '/updates?tab=learning&module=getting-started' };
  if (match(title, ['start before you sign in', 'three free scans', 'receipt scanning in action', 'smart receipt scanning', 'first receipt'])) return { label: 'Try your first scan', path: '/?start=scan' };
  if (match(title, ['who pays for what', 'business income', 'credit card', 'accounts, cash', 'paid from'])) return { label: 'Open Cash & Accounts', path: '/money' };
  if (match(title, ['story card', 'monthly summaries', 'financial reports', 'report'])) return { label: 'Explore reports', path: '/reports' };
  if (match(title, ['nuacha map'])) return { label: 'See your Nuacha map', path: '/dashboard#nuacha-map' };
  if (match(title, ['nis'])) return { label: 'Open the NIS calculator', path: '/payroll?tab=calculator' };
  if (match(title, ['payslip'])) return { label: 'Open payslips', path: '/payroll?tab=payslips' };
  if (match(title, ['cash or bank', 'holiday pay', 'payslip', 'payroll', 'nis'])) return { label: 'Explore Payroll & NIS', path: '/payroll?tab=log' };
  if (match(title, ['budget dashboard', 'budget builder'])) return { label: 'Explore budgeting', path: '/budget?tab=builder' };
  if (match(title, ['setting up your first family', 'family management', 'multi-family'])) return { label: 'Set up your family', path: '/options?tab=families' };
  if (match(title, ['per-member'])) return { label: 'View family expenses', path: '/app?tab=expenses' };
  if (match(title, ['reminder', 'due date'])) return { label: 'View reminders', path: '/app#reminders' };
  if (match(title, ['category'])) return { label: 'Manage categories', path: '/options?tab=categories' };
  if (match(title, ['multi-page'])) return { label: 'Learn multi-page scanning', path: '/updates?tab=learning&module=multi-page-receipts' };
  if (note.category === 'how-to') return { label: 'Open the matching lesson', path: '/updates?tab=learning' };
  if (note.feature_area === 'receipts' || note.feature_area === 'expense') return { label: 'Explore receipt tracking', path: '/?start=scan' };
  if (note.feature_area === 'families') return { label: 'Explore family setup', path: '/options?tab=families' };
  if (note.feature_area === 'budget') return { label: 'Explore budgeting', path: '/budget' };
  if (note.feature_area === 'payroll') return { label: 'Explore Payroll & NIS', path: '/payroll' };
  if (note.feature_area === 'reports') return { label: 'Explore reports', path: '/reports' };

  return { label: 'See what Nuacha can do', path: '/updates?tab=features#features' };
}