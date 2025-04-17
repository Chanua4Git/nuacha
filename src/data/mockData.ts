
import { v4 as uuidv4 } from 'uuid';

export interface Family {
  id: string;
  name: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  familyId?: string; // If null, it's a general category
}

export interface Expense {
  id: string;
  familyId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  place: string;
  needsReplacement?: boolean;
  replacementFrequency?: number; // in days
  nextReplacementDate?: string;
}

export interface Reminder {
  id: string;
  familyId: string;
  title: string;
  dueDate: string;
  isRecurring: boolean;
  frequency?: number; // in days
  type: 'bill' | 'replacement';
  relatedExpenseId?: string;
}

export const families: Family[] = [
  {
    id: '1',
    name: 'Family A',
    color: '#0EA5E9', // blue
  },
  {
    id: '2',
    name: 'Family B',
    color: '#10B981', // green
  },
  {
    id: '3',
    name: 'Family C',
    color: '#8B5CF6', // purple
  },
];

export const categories: Category[] = [
  // General categories
  { id: '1', name: 'Groceries', color: '#10B981' },
  { id: '2', name: 'Utilities', color: '#0EA5E9' },
  { id: '3', name: 'Transportation', color: '#F97316' },
  { id: '4', name: 'Healthcare', color: '#EF4444' },
  { id: '5', name: 'Entertainment', color: '#8B5CF6' },
  
  // Family A child categories
  { id: '6', name: 'School Fees', color: '#0EA5E9', familyId: '1' },
  { id: '7', name: 'School Supplies', color: '#0EA5E9', familyId: '1' },
  { id: '8', name: 'Child Clothing', color: '#10B981', familyId: '1' },
  { id: '9', name: 'Activities', color: '#8B5CF6', familyId: '1' },
  { id: '10', name: 'Child Healthcare', color: '#EF4444', familyId: '1' },
];

export const expenses: Expense[] = [
  {
    id: uuidv4(),
    familyId: '1',
    amount: 120.50,
    description: 'Weekly grocery shopping',
    category: '1',
    date: '2025-04-15',
    place: 'Whole Foods Market',
  },
  {
    id: uuidv4(),
    familyId: '1',
    amount: 45.30,
    description: 'Electricity bill',
    category: '2',
    date: '2025-04-10',
    place: 'City Power Co.',
  },
  {
    id: uuidv4(),
    familyId: '1',
    amount: 75.00,
    description: 'School uniform',
    category: '8',
    date: '2025-04-05',
    place: 'School Uniform Shop',
    needsReplacement: true,
    replacementFrequency: 180, // 6 months
    nextReplacementDate: '2025-10-05',
  },
  {
    id: uuidv4(),
    familyId: '2',
    amount: 89.99,
    description: 'Internet bill',
    category: '2',
    date: '2025-04-12',
    place: 'ISP Provider',
  },
  {
    id: uuidv4(),
    familyId: '2',
    amount: 35.40,
    description: 'Gas for car',
    category: '3',
    date: '2025-04-14',
    place: 'Shell Gas Station',
  },
  {
    id: uuidv4(),
    familyId: '3',
    amount: 62.75,
    description: 'Dinner out',
    category: '5',
    date: '2025-04-16',
    place: 'Local Restaurant',
  },
];

export const reminders: Reminder[] = [
  {
    id: uuidv4(),
    familyId: '1',
    title: 'School uniform replacement',
    dueDate: '2025-10-05',
    isRecurring: true,
    frequency: 180, // 6 months
    type: 'replacement',
    relatedExpenseId: expenses[2].id,
  },
  {
    id: uuidv4(),
    familyId: '1',
    title: 'Insurance payment',
    dueDate: '2025-05-01',
    isRecurring: true,
    frequency: 30, // monthly
    type: 'bill',
  },
  {
    id: uuidv4(),
    familyId: '2',
    title: 'Internet bill',
    dueDate: '2025-05-12',
    isRecurring: true,
    frequency: 30, // monthly
    type: 'bill',
  },
];
