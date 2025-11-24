import { ReleaseNote } from '@/types/updates';

// Real release notes based on actual features in the Nuacha app
export const releaseNotesData: Omit<ReleaseNote, 'id' | 'created_at' | 'updated_at'>[] = [
  // Feature: Multi-Family Expense Management
  {
    title: 'Multi-Family Expense Management',
    description: 'Track expenses for multiple households from a single account. Perfect for caregivers managing parents\' finances, landlords with multiple properties, or families with custody arrangements. Each family gets its own expense tracking, categories, and members.',
    category: 'feature',
    feature_area: 'families',
    released_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    is_published: true,
    display_order: 1,
    media_url: null,
    tutorial_steps: [
      {
        step: 1,
        title: 'Create Your First Family',
        description: 'Go to Options → Families tab and click "+ Add Family". Give it a name and color.',
      },
      {
        step: 2,
        title: 'Add Family Members',
        description: 'Click "Manage Members" for your family. Add children, adults, or any members you want to track.',
      },
      {
        step: 3,
        title: 'Start Tracking Expenses',
        description: 'When adding expenses, select which family and which members the expense applies to.',
      },
    ],
  },

  // Feature: Smart Receipt Scanning with AI
  {
    title: 'Smart Receipt Scanning with AI',
    description: 'Upload or photograph receipts—our AI extracts vendor name, date, total amount, and individual line items automatically. No more manual data entry. Just snap, review, and save.',
    category: 'feature',
    feature_area: 'receipts',
    released_at: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 2,
    media_url: null,
    tutorial_steps: [
      {
        step: 1,
        title: 'Upload Your Receipt',
        description: 'Click "Upload Receipt" on the landing page or Add Expense tab. Choose a photo from your device or take a new one.',
      },
      {
        step: 2,
        title: 'AI Extracts the Data',
        description: 'Our AI reads the receipt and extracts vendor, date, amount, and line items. This takes just a few seconds.',
      },
      {
        step: 3,
        title: 'Review & Save',
        description: 'Check the extracted data for accuracy. Edit anything if needed, then save your expense.',
      },
    ],
  },

  // Feature: Multi-Page Receipt Scanning
  {
    title: 'Multi-Page Receipt Scanning',
    description: 'Long receipts? No problem. Scan multiple pages and we\'ll intelligently merge them, detect missing totals or store names, and prevent duplicate line items. Perfect for grocery hauls and bulk purchases.',
    category: 'feature',
    feature_area: 'receipts',
    released_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 3,
    media_url: null,
    tutorial_steps: [
      {
        step: 1,
        title: 'Scan the First Page',
        description: 'Upload or photograph the first page of your long receipt as normal.',
      },
      {
        step: 2,
        title: 'Add More Pages',
        description: 'If the system detects missing data, click "Scan Next Page" to add additional pages.',
      },
      {
        step: 3,
        title: 'Automatic Merging',
        description: 'When you scan the final page with complete data, we merge all pages and remove duplicates automatically.',
      },
    ],
  },

  // Feature: Per-Member Expense Tracking
  {
    title: 'Per-Member Expense Tracking',
    description: 'Track who spent what within each family. Assign expenses to specific family members for detailed per-person spending insights. See exactly how much was spent on each child, adult, or household member.',
    category: 'feature',
    feature_area: 'families',
    released_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 4,
    media_url: null,
    tutorial_steps: null,
  },

  // Feature: Trinidad & Tobago NIS Payroll Calculator
  {
    title: '🇹🇹 Trinidad & Tobago NIS Payroll Calculator',
    description: 'Calculate NIS (National Insurance Scheme) contributions accurately using official T&T earnings classes and rates. Supports hourly, daily, weekly, and monthly employees. Local to Trinidad & Tobago.',
    category: 'feature',
    feature_area: 'payroll',
    released_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 5,
    media_url: null,
    tutorial_steps: [
      {
        step: 1,
        title: 'Add Your Employees',
        description: 'Go to Payroll → Employees and add each employee with their pay rate and schedule.',
      },
      {
        step: 2,
        title: 'Create a Payroll Period',
        description: 'Set up a pay period with start date, end date, and pay date.',
      },
      {
        step: 3,
        title: 'Calculate NIS Automatically',
        description: 'Enter hours or days worked. NIS contributions are calculated automatically using official T&T rates.',
      },
    ],
  },

  // Feature: Budget Builder with 50/30/20 Rules
  {
    title: 'Budget Builder with 50/30/20 Rules',
    description: 'Create personalized budgets with flexible allocation rules (50/30/20, 70/20/10, or custom). Track Needs, Wants, and Savings with real-time variance tracking. See exactly where your money goes.',
    category: 'feature',
    feature_area: 'budget',
    released_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 6,
    media_url: null,
    tutorial_steps: [
      {
        step: 1,
        title: 'Set Your Income',
        description: 'Add your monthly income sources in the Income tab.',
      },
      {
        step: 2,
        title: 'Choose Allocation Rule',
        description: 'Select 50/30/20 (or create custom percentages) for Needs, Wants, and Savings.',
      },
      {
        step: 3,
        title: 'Track vs Actuals',
        description: 'As you add expenses, watch your actual spending compared to your budget in real-time.',
      },
    ],
  },

  // Improvement: Smart Category Suggestions
  {
    title: 'Smart Category Suggestions',
    description: 'Line items now drive smarter category suggestions. Coffee items auto-categorize as "Dining out" regardless of vendor recognition. Grocery items intelligently match your categories even with name variations.',
    category: 'improvement',
    feature_area: 'receipts',
    released_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 7,
    media_url: null,
    tutorial_steps: null,
  },

  // Feature: Financial Reports & Export
  {
    title: 'Financial Reports & Export',
    description: 'Generate comprehensive expense analysis reports by date range, category, and family. Export your data to CSV for tax preparation, spreadsheet analysis, or personal records.',
    category: 'feature',
    feature_area: 'reports',
    released_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 8,
    media_url: null,
    tutorial_steps: null,
  },

  // Feature: Reminders & Due Date Tracking
  {
    title: 'Reminders & Due Date Tracking',
    description: 'Never miss a bill or replacement date. Set reminders for recurring expenses with automatic countdown tracking. See all upcoming due dates in one place on your dashboard.',
    category: 'feature',
    feature_area: 'general',
    released_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 9,
    media_url: null,
    tutorial_steps: null,
  },

  // Feature: Developer Updates & Feedback Center
  {
    title: 'Developer Updates & Feedback Center',
    description: 'Stay informed with our new updates page. Browse feature releases, leave feedback, explore learning resources, and discover everything Nuacha can do—all in one place.',
    category: 'feature',
    feature_area: 'general',
    released_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    is_published: true,
    display_order: 10,
    media_url: null,
    tutorial_steps: null,
  },

  // Feature: Family Administration Interface
  {
    title: 'Centralized Family Management',
    description: 'New dedicated admin interface for managing all your families in one place. View, create, edit, and delete families with cascade deletion that safely removes all related data. Accessible from Options → Families tab.',
    category: 'feature',
    feature_area: 'families',
    released_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 11,
    media_url: null,
    tutorial_steps: null,
  },

  // HOW-TO GUIDE: How to Scan Your First Receipt
  {
    title: 'How to Scan Your First Receipt',
    description: 'Step-by-step guide to scanning receipts with AI. Learn how to upload, review extracted data, and save expenses quickly.',
    category: 'how-to',
    feature_area: 'receipts',
    released_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 20,
    media_url: null,
    tutorial_steps: [
      {
        step: 1,
        title: 'Find the Upload Button',
        description: 'On the landing page or in the Add Expense tab, look for "Upload Receipt" or the camera icon.',
      },
      {
        step: 2,
        title: 'Choose Your Receipt Image',
        description: 'Select a clear photo of your receipt. Make sure the text is readable and not blurry.',
      },
      {
        step: 3,
        title: 'Wait for AI Processing',
        description: 'The AI will extract vendor name, date, total, and line items. This takes 3-5 seconds.',
      },
      {
        step: 4,
        title: 'Review the Data',
        description: 'Check that all fields are correct. You can edit any field if the AI missed something.',
      },
      {
        step: 5,
        title: 'Assign to Family & Members',
        description: 'Select which family this expense belongs to, and optionally assign to specific family members.',
      },
      {
        step: 6,
        title: 'Save Your Expense',
        description: 'Click "Save Expense" and you\'re done! Your receipt is stored and categorized.',
      },
    ],
  },

  // HOW-TO GUIDE: Setting Up Your First Family
  {
    title: 'Setting Up Your First Family',
    description: 'Guide for new users on creating families and adding members. Learn how to organize your household tracking.',
    category: 'how-to',
    feature_area: 'families',
    released_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 21,
    media_url: null,
    tutorial_steps: [
      {
        step: 1,
        title: 'Navigate to Options',
        description: 'Click the Options link in the navigation menu.',
      },
      {
        step: 2,
        title: 'Go to Families Tab',
        description: 'Select the "Families" tab at the top of the Options page.',
      },
      {
        step: 3,
        title: 'Create a New Family',
        description: 'Click "+ Add Family" button. Enter a name (e.g., "Smith Family") and choose a color for visual identification.',
      },
      {
        step: 4,
        title: 'Add Family Members',
        description: 'Click "Manage Members" for your newly created family. Add each member with their name, type (Adult/Child), and optional date of birth.',
      },
      {
        step: 5,
        title: 'Start Tracking',
        description: 'You\'re all set! Now when you add expenses, select this family and assign costs to specific members.',
      },
    ],
  },

  // HOW-TO GUIDE: Understanding Your Budget Dashboard
  {
    title: 'Understanding Your Budget Dashboard',
    description: 'Learn how to navigate the Budget page and interpret your spending insights. Master Needs, Wants, and Savings tracking.',
    category: 'how-to',
    feature_area: 'budget',
    released_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 22,
    media_url: null,
    tutorial_steps: [
      {
        step: 1,
        title: 'Open the Budget Page',
        description: 'Click "Budget" in the main navigation. You\'ll see tabs for Dashboard, Income, Expenses, Rules, and Scenarios.',
      },
      {
        step: 2,
        title: 'Dashboard Overview',
        description: 'The Dashboard tab shows your total income, allocated budget (by Needs/Wants/Savings), and actual spending.',
      },
      {
        step: 3,
        title: 'Green = Good, Red = Over Budget',
        description: 'Variance indicators show if you\'re under (green) or over (red) budget in each category.',
      },
      {
        step: 4,
        title: 'Income Tab',
        description: 'Add your monthly income sources here. You can add multiple sources with different frequencies.',
      },
      {
        step: 5,
        title: 'Expenses Tab',
        description: 'Review categorized expenses. Each expense is tagged as Need, Want, or Savings based on its category.',
      },
      {
        step: 6,
        title: 'Rules Tab',
        description: 'Set your allocation rule (50/30/20, custom, etc.). This determines how your income is divided.',
      },
    ],
  },

  // SHOWCASE: See Receipt Scanning in Action
  {
    title: 'See Receipt Scanning in Action',
    description: 'Watch how our AI extracts vendor information, line items, and totals from real receipts in seconds. Perfect for taxpayers, business owners, and anyone who wants to eliminate manual data entry.',
    category: 'showcase',
    feature_area: 'receipts',
    released_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_published: true,
    display_order: 30,
    media_url: null, // Can be populated with demo video/GIF later
    tutorial_steps: null,
  },
];
