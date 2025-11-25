export interface LearningStep {
  id: string;
  title: string;
  description: string;
  detailedInstructions: string; // Markdown
  targetSelector?: string;
  screenshotHint?: string;
  ctaButton?: { label: string; path: string };
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  estimatedTime: string;
  steps: LearningStep[];
  prerequisites?: string[];
  track: 'Start Here' | 'Everyday Money' | 'Budgeting & Insights' | 'Advanced & T&T';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  tags?: string[];
  videoUrl?: string;
  isComingSoon?: boolean;
  featureFlagKey?: string;
}

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  icon: string;
  modules: string[]; // Module IDs
}

export const learningTracks: LearningTrack[] = [
  {
    id: 'start-here',
    title: 'Start Here',
    description: 'New to Nuacha? Begin your journey with these essential basics.',
    icon: 'Sparkles',
    modules: ['getting-started', 'first-receipt-scan', 'setting-up-family']
  },
  {
    id: 'everyday-money',
    title: 'Everyday Money',
    description: 'Master daily expense tracking and family management.',
    icon: 'Wallet',
    modules: ['multi-page-receipts', 'adding-members', 'manual-expenses', 'expense-types', 'viewing-expenses']
  },
  {
    id: 'budgeting-insights',
    title: 'Budgeting & Insights',
    description: 'Plan your spending and understand where your money goes.',
    icon: 'PieChart',
    modules: ['building-budget', 'budget-dashboard', 'generating-reports']
  },
  {
    id: 'advanced-tnt',
    title: 'Advanced & T&T',
    description: 'Power features and Trinidad & Tobago-specific tools.',
    icon: 'Zap',
    modules: ['tnt-payroll', 'managing-categories']
  }
];

export const learningModules: LearningModule[] = [
  // ==================== TRACK 1: START HERE ====================
  {
    id: 'getting-started',
    title: 'Getting Started – Navigation Basics',
    description: 'Learn to find your way around Nuacha',
    icon: 'Map',
    estimatedTime: '3 min',
    track: 'Start Here',
    level: 'Beginner',
    tags: ['navigation', 'basics'],
    steps: [
      {
        id: 'step-1-1',
        title: 'Welcome to Nuacha',
        description: 'Your first look at where everything begins.',
        detailedInstructions: `When you arrive at Nuacha, you will see a calm, welcoming page designed to help you get started quickly.

**What you will notice:**

- **Hero section**: Front and center, you will see a prompt like "Scan a receipt to start" with two buttons: 📷 Camera and 📤 Upload.
- **Navigation bar**: At the top, you will find the Nuacha logo (click it anytime to return home) and main menu options.
- **Feature highlights**: Scroll down to see how Nuacha helps you track spending more softly and clearly.

**Where to find it:**
Go to nuacha.com – this is the first screen you will see.

**Pro tip:**
You do not need an account to try your first receipt scan. We will walk you through creating one when you are ready.`,
        screenshotHint: 'Landing page showing hero section with upload buttons and navigation bar',
        ctaButton: { label: 'Go to Home', path: '/' }
      },
      {
        id: 'step-1-2',
        title: 'Finding Your Way Around',
        description: 'How to access different parts of the app.',
        detailedInstructions: `The navigation bar at the top helps you move between sections. What you see depends on whether you are signed in:

**Before You Sign In:**
- **Nuacha logo** (top left): Click to return to the landing page.
- **Auth Demo**: Explore authentication features.
- **Updates**: See what is new and access this Learning section.
- **Sign in**: Create your account or log back in.

**After You Sign In:**
- **Nuacha logo** (top left): Click to return to the landing page.
- **Expense** dropdown: Access Dashboard, Add Expense, Budget & Planning, Receipt Management, Reports, and Settings.
- **Reminders**: View upcoming bills and replacement reminders.
- **Payroll** dropdown: Calculate Trinidad & Tobago NIS contributions (🇹🇹) and manage payroll periods.
- **Auth Demo**: Explore authentication features.
- **Updates**: See what is new and access this Learning section.
- **Sign out**: Log out of your account.

**On mobile:**
Tap the ☰ menu icon to reveal these navigation options (works for both signed-in and signed-out states).

**Where to find it:**
Top of any page → Navigation bar

**Pro tip:**
After you have signed in, bookmark /dashboard to jump straight into your expense tracker dashboard.`,
        screenshotHint: 'Navigation bar with all menu items visible',
        ctaButton: { label: 'Explore Navigation', path: '/' }
      },
      {
        id: 'step-1-3',
        title: 'Demo Mode vs Full App',
        description: 'What you can try without an account.',
        detailedInstructions: `Nuacha lets you explore features before you create an account.

**Without an account, you can:**

- Scan a receipt and watch OCR in action.
- View sample expense data in demo mode.
- Explore the budget builder interface.
- Try the Trinidad & Tobago payroll calculator.

**With an account, you unlock:**

- Saving your expenses permanently.
- Creating multiple families.
- Building personalized budgets.
- Tracking spending over time.
- Generating reports.

**Where to find demo:**
Click "Try Demo" in the navigation, or simply scan a receipt from the landing page to start.`,
        screenshotHint: 'Demo mode interface showing sample data',
        ctaButton: { label: 'Try Demo', path: '/demo' }
      }
    ]
  },
  {
    id: 'first-receipt-scan',
    title: 'Your First Receipt Scan (2-Minute Setup)',
    description: 'Turn a paper receipt into tracked data automatically',
    icon: 'Scan',
    estimatedTime: '5 min',
    track: 'Start Here',
    level: 'Beginner',
    tags: ['receipts', 'scanning', 'ocr'],
    steps: [
      {
        id: 'step-2-1',
        title: 'Where to Start Your Scan',
        description: 'Locate the receipt upload area on the landing page.',
        detailedInstructions: `1. Go to the home page (click the Nuacha logo if you are elsewhere).
2. Look at the **hero section** – the large area at the top of the page.
3. You will see the heading like "Scan a receipt to start".
4. Just below, you will find two buttons side by side:
   - 📷 **Camera** – opens your device camera.
   - 📤 **Upload** – lets you pick a saved file.

**Where to find it:**
Landing page → Hero section → Camera / Upload buttons

**Pro tip:**
Make sure your receipt is well-lit and the text is clear for best OCR results.`,
        screenshotHint: 'Landing page hero section highlighting upload buttons',
        ctaButton: { label: 'Go to Home', path: '/' }
      },
      {
        id: 'step-2-2',
        title: 'Snap or Select',
        description: 'Pick the right method for your situation.',
        detailedInstructions: `**Use 📷 Camera when:**

- You have a physical receipt in front of you.
- You are on your phone.
- You want to capture it right now.

**Use 📤 Upload when:**

- You already took a photo earlier.
- The receipt image is saved on your device.
- You are on a laptop/desktop.
- You have a scanned PDF.

**How to use Camera (mobile):**

1. Tap **Camera**.
2. Your phone camera opens.
3. Position the receipt so all text is visible.
4. Take the photo.
5. Confirm the image to start processing.

**How to use Upload:**

1. Click **Upload**.
2. Browse your files.
3. Select the receipt image (JPG, PNG, or PDF).
4. Click Open / Select to upload.

**Where to find it:**
Landing page → Hero section → Camera / Upload

**Pro tip:**
For best results, make sure the receipt is well-lit, flat, and all the text is readable.`,
        screenshotHint: 'Upload interface with camera and file picker options',
        ctaButton: { label: 'Try Upload', path: '/' }
      },
      {
        id: 'step-2-3',
        title: 'Let the AI Do Its Magic',
        description: 'What happens while your receipt is being read.',
        detailedInstructions: `After you capture or upload your receipt:

1. A **loading overlay** appears with a gentle animation.
2. You will see a message like "Processing your receipt…"
3. Behind the scenes, Nuacha AI is extracting:
   - Store or vendor name
   - Date of purchase
   - Total amount
   - Individual line items (where possible)
   - Other key details

Processing usually takes a few seconds. Longer receipts with many items may take a bit more time.

**What you will see:**

- The screen dims slightly.
- A spinner or loading indicator shows progress.
- When it is done, you will be taken to a pre-filled expense form.

**Pro tip:**
Do not refresh the page while it is processing. Once the AI is finished, you will see the results automatically.`,
        screenshotHint: 'Loading overlay during OCR processing',
        ctaButton: { label: 'Try Scanning', path: '/' }
      },
      {
        id: 'step-2-4',
        title: 'Check What We Found',
        description: 'See the AI results and make corrections if needed.',
        detailedInstructions: `Once processing is complete, you will see an expense form with fields pre-filled from your receipt, such as:

- **Amount** – total from your receipt.
- **Description** – often the store name.
- **Place** – where you made the purchase.
- **Date** – the purchase date.
- **Category** – Nuacha best guess based on the receipt.

**Go through each field:**

✅ If it is correct, move on.
✏️ If something looks off, click the field and edit it.

**Where to find it:**
After OCR completes → App → Add Expense tab

**Pro tip:**
The AI does the heavy lifting, but a quick 5–10 second review keeps your records clean and accurate.`,
        screenshotHint: 'Expense form with pre-filled OCR data',
        ctaButton: { label: 'View Form', path: '/app?tab=add-expense' }
      },
      {
        id: 'step-2-5',
        title: 'The Details Behind Your Total',
        description: 'See exactly what you purchased, item by item.',
        detailedInstructions: `Scroll below the main expense fields to find the **Receipt details** section.

You will see a table with:

- **Item description** – what you bought.
- **Quantity** – how many.
- **Unit price** – price per item.
- **Total** – line total.

Depending on your configuration, you may also see suggested categories or member assignments.

**What you can do here:**

- Edit item descriptions.
- Adjust quantities or prices if needed.
- Update categories for each item.
- Assign items to specific family members.

**Where to find it:**
Add Expense tab → Scroll down → Receipt details section

**Pro tip:**
Line-item detail gives you a clear picture of where your money truly goes – not just how much you spent.`,
        screenshotHint: 'Receipt details section showing line items table',
        ctaButton: { label: 'View Receipt Details', path: '/app?tab=add-expense' }
      },
      {
        id: 'step-2-6',
        title: 'Make It Official',
        description: 'Save your scanned expense to your account.',
        detailedInstructions: `When you are happy with the details:

1. **Select a Family** – choose which household this expense belongs to.
   - If you do not have any families yet, you will see a friendly setup prompt.
2. Review the amount, description, category, and date.
3. Click **"Save Expense"**.

**After saving:**

- Your expense is stored in your history.
- The receipt image is attached to it.
- It will show up in your Expenses tab, reports, and budget tracking.

**Where to find it:**
Add Expense tab → bottom of the form → Save Expense button

**Pro tip:**
After saving, you will land on the Expenses tab so you can see your new entry right away.`,
        screenshotHint: 'Save expense button at bottom of form',
        ctaButton: { label: 'Add Expense', path: '/app?tab=add-expense' }
      }
    ]
  },
  {
    id: 'setting-up-family',
    title: 'Setting Up Your First Family',
    description: 'Create your household bucket to organize expenses',
    icon: 'Users',
    estimatedTime: '3 min',
    track: 'Start Here',
    level: 'Beginner',
    tags: ['families', 'setup'],
    steps: [
      {
        id: 'step-4-1',
        title: 'Family Setup Modal',
        description: 'The prompt that appears after your first scan.',
        detailedInstructions: `After you scan your first receipt, you will see a friendly modal asking you to set up a family.

**What you will see:**

- If you have no families yet: "Let us set up your first family"
- If you have existing families: A dropdown to select or create a new one

**Why families matter:**

Think of families as **buckets** for organizing expenses. Each family represents a separate household you manage – your own home, a parent home, or a rental property.

**Where to find it:**
After scanning your first receipt → Family setup modal appears

**Pro tip:**
Families help you see spending clearly when managing multiple households.`,
        screenshotHint: 'Family setup modal after receipt scan',
        ctaButton: { label: 'Scan Receipt', path: '/' }
      },
      {
        id: 'step-4-2',
        title: 'Naming Your Family',
        description: 'Choose a clear name that makes sense to you.',
        detailedInstructions: `In the family setup form:

1. Enter a **Family Name** – something simple like:
   - "Our Home"
   - "Mom House"
   - "Beach Rental"
   - "Main Household"

2. Keep it short and descriptive.

**Where to find it:**
Family setup modal → Name input field

**Pro tip:**
Use names that help you instantly recognize which household the expense belongs to.`,
        screenshotHint: 'Family name input field',
        ctaButton: { label: 'Create Family', path: '/options?tab=families' }
      },
      {
        id: 'step-4-3',
        title: 'Choosing a Color',
        description: 'Pick a color to visually identify this family.',
        detailedInstructions: `Each family gets a **color badge** that appears throughout the app.

**How to choose:**

1. Click the color picker in the family form.
2. Select a color that feels right for this household.
3. The color will appear on expense cards, filters, and reports.

**Why colors help:**

When you are managing multiple families, color-coded badges make it easy to spot which expenses belong where at a glance.

**Where to find it:**
Family form → Color picker

**Pro tip:**
Choose distinct colors for each family so they are easy to tell apart.`,
        screenshotHint: 'Color picker in family form',
        ctaButton: { label: 'Manage Families', path: '/options?tab=families' }
      },
      {
        id: 'step-4-4',
        title: 'Saving Your Family',
        description: 'Finalize and create your household bucket.',
        detailedInstructions: `When you are happy with the name and color:

1. Click **"Save"** or **"Create Family"**.
2. The modal closes and your family is ready to use.
3. You will return to the expense form with your new family pre-selected.

**What happens next:**

- Your family appears in dropdowns throughout the app.
- All future expenses can be assigned to this family.
- You can create more families anytime in Settings.

**Where to find it:**
Family form → Save button

**Pro tip:**
Once saved, your family is immediately ready for expense tracking.`,
        screenshotHint: 'Save button in family form',
        ctaButton: { label: 'View Families', path: '/options?tab=families' }
      },
      {
        id: 'step-4-5',
        title: 'Managing Families in Settings',
        description: 'Where to create, edit, or delete families later.',
        detailedInstructions: `You can manage all your families in one place:

**How to get there:**

1. Click **Settings** in the navigation (or the gear icon).
2. Go to the **"Families"** tab (first tab by default).

**What you can do:**

- View all your families in a table.
- Click **"+ Add Family"** to create more.
- Click the edit icon to change name or color.
- Click the delete icon to remove a family (with confirmation).

**Remember:** Deleting a family will also delete all its associated expenses, members, and budgets.

**Where to find it:**
Settings → Families tab

**Pro tip:**
Review your families periodically to keep your organization clean.`,
        screenshotHint: 'Settings page with Families tab selected',
        ctaButton: { label: 'Go to Settings', path: '/options?tab=families' }
      }
    ]
  },

  // ==================== TRACK 2: EVERYDAY MONEY ====================
  {
    id: 'multi-page-receipts',
    title: 'Multi-Page Receipt Scanning',
    description: 'Handle long receipts that span multiple pages',
    icon: 'FileStack',
    estimatedTime: '3 min',
    track: 'Everyday Money',
    level: 'Intermediate',
    tags: ['receipts', 'scanning', 'advanced'],
    prerequisites: ['first-receipt-scan'],
    steps: [
      {
        id: 'step-3-1',
        title: 'When to Use Multi-Page',
        description: 'Recognizing receipts that need multiple scans.',
        detailedInstructions: `Some receipts are too long to capture in one photo:

**Use multi-page scanning when:**

- Your grocery receipt has 20+ items.
- The receipt is folded or rolled up.
- You notice the bottom is cut off or totals are missing.
- Important details like store name or date are not visible.

**How to tell:**

After the first scan, if you do not see a total amount or the vendor name, it is likely you need to scan additional pages.

**Where to find it:**
After first scan → If receipt appears incomplete

**Pro tip:**
Better to scan too many sections than to miss important details.`,
        screenshotHint: 'Long receipt example',
        ctaButton: { label: 'Try Scanning', path: '/' }
      },
      {
        id: 'step-3-2',
        title: 'Scanning Additional Pages',
        description: 'Add more images to complete the receipt.',
        detailedInstructions: `After your first scan processes:

1. Look for the **"Scan Next Page of Receipt"** button.
2. It appears in multiple places:
   - Below the receipt details section
   - In the expense form area
3. Click the button to upload/capture the next section.
4. Repeat until you have captured the entire receipt.

**What Nuacha does:**

- Keeps track of all pages you have scanned.
- Waits for the final page with complete data.
- Shows a "Finalize Receipt" option when ready.

**Where to find it:**
Add Expense form → Scan Next Page button

**Pro tip:**
You can scan as many sections as needed before finalizing.`,
        screenshotHint: 'Scan next page button in expense form',
        ctaButton: { label: 'Add Expense', path: '/app?tab=add-expense' }
      },
      {
        id: 'step-3-3',
        title: 'Finalizing the Merge',
        description: 'Combine all pages into one complete expense.',
        detailedInstructions: `When you have scanned all sections:

1. Click **"Finalize Receipt"**.
2. Nuacha intelligently merges all pages:
   - Combines line items from all scans.
   - Deduplicates repeated items.
   - Uses the most complete data (totals, vendor, date).
3. Review the merged result in the expense form.
4. Make any final edits.
5. Save your expense.

**Where to find it:**
Add Expense form → Finalize Receipt button

**Pro tip:**
The system prevents duplicate entries when you finalize, so do not worry about scanning the same section twice.`,
        screenshotHint: 'Finalize receipt button and merged data',
        ctaButton: { label: 'View Form', path: '/app?tab=add-expense' }
      }
    ]
  },
  {
    id: 'adding-members',
    title: 'Adding Family Members',
    description: 'Track who each expense is for',
    icon: 'UserPlus',
    estimatedTime: '2 min',
    track: 'Everyday Money',
    level: 'Beginner',
    tags: ['members', 'tracking'],
    prerequisites: ['setting-up-family'],
    steps: [
      {
        id: 'step-5-1',
        title: 'Why Track Members',
        description: 'Understanding member-level expense tracking.',
        detailedInstructions: `Family members let you see spending per person, not just per household.

**Use cases:**

- Track children expenses (school fees, clothing, activities).
- See how much you spend on elderly parents care.
- Understand per-person costs in shared households.

**Remember:** Members belong to a specific family. If you manage multiple families, each one has its own members.

**Where to find it:**
Settings → Family Members tab

**Pro tip:**
Member tracking gives insight into individual spending patterns over time.`,
        screenshotHint: 'Member expense breakdown in reports',
        ctaButton: { label: 'View Members', path: '/options?tab=members' }
      },
      {
        id: 'step-5-2',
        title: 'Creating a New Member',
        description: 'Add people to your family.',
        detailedInstructions: `**How to add a member:**

1. Go to **Settings** → **Family Members** tab.
2. Click **"+ Add Member"**.
3. Fill in the form:
   - **Name**: The person name (e.g., "Sarah", "Dad", "Alex").
   - **Family**: Select which family they belong to.
   - **Type**: Choose Child, Adult, or Other.
   - **Date of Birth** (optional): Helps with age-specific tracking.
   - **Notes** (optional): Any relevant details.
4. Click **"Save"**.

**Where to find it:**
Settings → Family Members → Add Member button

**Pro tip:**
You can create members for pets too. Use "Other" as the type.`,
        screenshotHint: 'Add member form',
        ctaButton: { label: 'Add Member', path: '/options?tab=members' }
      },
      {
        id: 'step-5-3',
        title: 'Assigning Members to Expenses',
        description: 'Connect expenses to specific people.',
        detailedInstructions: `When adding or editing an expense:

1. Look for the **"Family Members"** section.
2. Select one or multiple members this expense is for.
3. You can assign:
   - **Single member**: "School fees for Alex"
   - **Multiple members**: "Groceries for the whole family"
   - **Partial allocation**: "40% Alex, 60% Sarah"

**Where to find it:**

- Add Expense form → Family Members selector
- Edit existing expense → Update members
- Receipt line items → Assign per item

**Pro tip:**
Use member tracking to see individual spending trends in reports.`,
        screenshotHint: 'Member selector in expense form',
        ctaButton: { label: 'Add Expense', path: '/app?tab=add-expense' }
      }
    ]
  },
  {
    id: 'manual-expenses',
    title: 'Adding Expenses Manually',
    description: 'Record expenses without a receipt',
    icon: 'Edit3',
    estimatedTime: '3 min',
    track: 'Everyday Money',
    level: 'Beginner',
    tags: ['expenses', 'manual-entry'],
    steps: [
      {
        id: 'step-6-1',
        title: 'When to Use Manual Entry',
        description: 'Situations that do not involve receipts.',
        detailedInstructions: `Manual entry is perfect for:

- Digital payments (Venmo, PayPal, bank transfers).
- Cash transactions without receipts.
- Subscription renewals.
- Bill payments.
- Quick entries when you do not have the receipt handy.

**Getting there:**

1. Click **App** in navigation (or log in).
2. Go to the **"Add Expense"** tab.

**Where to find it:**
App → Add Expense tab

**Pro tip:**
Manual entry is just as valid as scanned receipts for tracking.`,
        screenshotHint: 'Manual expense form',
        ctaButton: { label: 'Add Expense', path: '/app?tab=add-expense' }
      },
      {
        id: 'step-6-2',
        title: 'Filling the Form',
        description: 'Enter your expense details step by step.',
        detailedInstructions: `**Required fields:**

1. **Amount** – how much you spent (numbers only).
2. **Description** – what you bought ("Weekly groceries", "Internet bill").
3. **Place** – where you spent it ("Safeway", "Comcast", "Cash").
4. **Date** – when the expense occurred.
5. **Family** – which household this belongs to.
6. **Category** – what type of expense (Groceries, Utilities, etc.).

**Optional fields:**

- **Expense Type**: Actual, Planned, or Recurring.
- **Family Members**: Who this expense is for.
- **Notes**: Any additional context.

**Where to find it:**
Add Expense form → Fill all fields

**Pro tip:**
Take 30 seconds to fill it completely for better tracking later.`,
        screenshotHint: 'Expense form with all fields',
        ctaButton: { label: 'Fill Form', path: '/app?tab=add-expense' }
      },
      {
        id: 'step-6-3',
        title: 'Choosing a Category',
        description: 'Organize your expense for tracking.',
        detailedInstructions: `Categories help you understand spending patterns.

**How to select:**

1. Click the **Category** dropdown.
2. Browse the list or start typing to filter.
3. Choose the best match for your expense.

**Common categories:**

- Groceries
- Dining Out
- Utilities
- Transportation
- Healthcare
- Clothing
- Entertainment

**Cannot find what you need?**

Go to Settings → Categories to create custom categories for your family.

**Where to find it:**
Add Expense form → Category dropdown

**Pro tip:**
Consistent categorization makes reports more meaningful.`,
        screenshotHint: 'Category dropdown selector',
        ctaButton: { label: 'View Categories', path: '/options?tab=categories' }
      },
      {
        id: 'step-6-4',
        title: 'Saving Your Expense',
        description: 'Add it to your records.',
        detailedInstructions: `Once all required fields are filled:

1. Review your entries one more time.
2. Click **"Save Expense"** at the bottom of the form.
3. You will be redirected to the **Expenses** tab.
4. Your new expense appears at the top of the list.

**Where to find it:**
Add Expense form → Save Expense button

**Pro tip:**
After saving, the form clears so you can quickly add another expense if needed.`,
        screenshotHint: 'Save expense button',
        ctaButton: { label: 'Save Expense', path: '/app?tab=add-expense' }
      }
    ]
  },
  {
    id: 'expense-types',
    title: 'Understanding Expense Types',
    description: 'Actual vs Planned vs Recurring expenses',
    icon: 'Tag',
    estimatedTime: '2 min',
    track: 'Everyday Money',
    level: 'Beginner',
    tags: ['expenses', 'types'],
    steps: [
      {
        id: 'step-7-1',
        title: 'The Three Types',
        description: 'How Nuacha categorizes expenses.',
        detailedInstructions: `**Actual Expenses:**

- Money you have already spent.
- Default type for most entries.
- Example: Groceries you bought yesterday.

**Planned Expenses:**

- Money you intend to spend soon.
- Helps with budgeting upcoming purchases.
- Example: Birthday gift you are planning to buy.

**Recurring Expenses:**

- Regular payments that repeat.
- Set a frequency (weekly, monthly, yearly).
- Example: Netflix subscription, rent, insurance.

**Where to find it:**
Add Expense form → Expense Type selector

**Pro tip:**
Use all three types to get a complete picture of your finances.`,
        screenshotHint: 'Expense type selector',
        ctaButton: { label: 'Add Expense', path: '/app?tab=add-expense' }
      },
      {
        id: 'step-7-2',
        title: 'Setting Recurring Patterns',
        description: 'Automate tracking for regular bills.',
        detailedInstructions: `When you select **Recurring** as the expense type:

1. Choose the **frequency**:
   - Every week
   - Every 2 weeks
   - Monthly
   - Quarterly
   - Yearly
   - Custom

2. Set the **start date** (when it first occurs).

3. Optionally set an **end date** (if it is temporary).

Nuacha will remind you when the next payment is due.

**Where to find it:**
Add Expense form → Set as Recurring → Choose frequency

**Pro tip:**
Set up all recurring bills once, then forget about manually tracking them.`,
        screenshotHint: 'Recurring expense frequency selector',
        ctaButton: { label: 'Set Recurring', path: '/app?tab=add-expense' }
      },
      {
        id: 'step-7-3',
        title: 'Replacement Reminders',
        description: 'Track items that need periodic replacement.',
        detailedInstructions: `For items you buy regularly but not on a strict schedule:

1. Check **"Needs Replacement"** when adding the expense.
2. Set the typical **replacement frequency** (e.g., "every 3 months").
3. Nuacha analyzes past purchases to predict when you will need more.

**Use cases:**

- Kids shoes (every 6 months)
- Air filters (every 3 months)
- School supplies (every term)

**Where to find it:**
Add Expense form → Needs Replacement checkbox

**Pro tip:**
You will get gentle reminders a week before the expected replacement date.`,
        screenshotHint: 'Replacement frequency settings',
        ctaButton: { label: 'Track Replacements', path: '/app?tab=add-expense' }
      }
    ]
  },
  {
    id: 'viewing-expenses',
    title: 'Viewing Your Expenses',
    description: 'Browse and filter your spending history',
    icon: 'List',
    estimatedTime: '2 min',
    track: 'Everyday Money',
    level: 'Beginner',
    tags: ['expenses', 'viewing'],
    steps: [
      {
        id: 'step-8-1',
        title: 'Expenses Tab Overview',
        description: 'Your spending history at a glance.',
        detailedInstructions: `**How to get there:**

1. Click **App** in navigation.
2. Go to the **"Expenses"** tab (second tab).

**What you will see:**

- All your expenses listed in reverse chronological order (newest first).
- Each expense card shows:
  - Family color badge
  - Date
  - Description
  - Amount
  - Category
  - Place
  - Receipt thumbnail (if available)

**Quick actions:**

- Click any expense card to view full details.
- Click the edit icon to modify.
- Click the delete icon to remove.

**Where to find it:**
App → Expenses tab

**Pro tip:**
Review your expenses regularly to spot patterns and stay on track.`,
        screenshotHint: 'Expenses tab with list of expense cards',
        ctaButton: { label: 'View Expenses', path: '/app?tab=expenses' }
      },
      {
        id: 'step-8-2',
        title: 'Filtering by Family',
        description: 'Focus on one household at a time.',
        detailedInstructions: `At the top of the Expenses tab:

1. You will see a **Family filter** dropdown.
2. Click it to see all your families.
3. Select a specific family to show only their expenses.
4. Choose "All Families" to see everything again.

**Where to find it:**
Expenses tab → Family filter dropdown (top of page)

**Pro tip:**
Use this when you want to review spending for just one household without distractions.`,
        screenshotHint: 'Family filter dropdown in expenses tab',
        ctaButton: { label: 'Filter Expenses', path: '/app?tab=expenses' }
      }
    ]
  },

  // ==================== TRACK 3: BUDGETING & INSIGHTS ====================
  {
    id: 'building-budget',
    title: 'Building Your Budget',
    description: 'Create a spending plan with the 50/30/20 rule',
    icon: 'Calculator',
    estimatedTime: '5 min',
    track: 'Budgeting & Insights',
    level: 'Intermediate',
    tags: ['budget', 'planning'],
    steps: [
      {
        id: 'step-9-1',
        title: 'Accessing the Budget Builder',
        description: 'Where to create your budget.',
        detailedInstructions: `**How to get there:**

1. Click **Budget** in the navigation bar.
2. You will see the Budget page with several options.
3. Look for the **"SAHM Budget Builder"** or similar budget creation tool.

**What the Budget Builder does:**

Helps you allocate your income across three categories using proven financial rules like 50/30/20.

**Where to find it:**
Budget page → Budget Builder section

**Pro tip:**
Set aside 15 minutes to build your first budget without distractions.`,
        screenshotHint: 'Budget page with builder option',
        ctaButton: { label: 'Open Budget', path: '/budget' }
      },
      {
        id: 'step-9-2',
        title: 'Setting Your Income',
        description: 'Tell Nuacha how much you earn.',
        detailedInstructions: `Start by entering your **total monthly income**:

1. Include all sources:
   - Salary/wages
   - Side gigs
   - Rental income
   - Support payments
   - Any other regular income

2. Enter the amount in your local currency.

**Why this matters:**

Your budget allocations are percentages of your total income, so accuracy here ensures realistic spending limits.

**Where to find it:**
Budget Builder → Income input field

**Pro tip:**
Use your average monthly income if it varies month to month.`,
        screenshotHint: 'Income input field in budget builder',
        ctaButton: { label: 'Set Income', path: '/budget' }
      },
      {
        id: 'step-9-3',
        title: 'Understanding the 50/30/20 Rule',
        description: 'A simple framework for balanced spending.',
        detailedInstructions: `The **50/30/20 rule** divides your income into three buckets:

**50% – Needs**
Essential expenses you cannot avoid:
- Rent/mortgage
- Utilities
- Groceries
- Transportation
- Insurance

**30% – Wants**
Things that make life enjoyable but are not essential:
- Dining out
- Entertainment
- Hobbies
- Subscriptions

**20% – Savings**
Building your financial security:
- Emergency fund
- Retirement contributions
- Debt repayment
- Investment savings

**Can I adjust these?**

Absolutely. Nuacha lets you customize the percentages to fit your situation.

**Where to find it:**
Budget Builder → Rule selection

**Pro tip:**
Start with 50/30/20 and adjust as you learn your spending patterns.`,
        screenshotHint: '50/30/20 allocation visual',
        ctaButton: { label: 'View Rules', path: '/budget' }
      },
      {
        id: 'step-9-4',
        title: 'Allocating by Category',
        description: 'Assign budget amounts to each category.',
        detailedInstructions: `Within each bucket (Needs/Wants/Savings), assign specific amounts to categories:

**Example for Needs (50%):**
- Groceries: $600
- Rent: $1200
- Utilities: $200
- Transportation: $150

**How to allocate:**

1. Select a category.
2. Enter the monthly budget amount.
3. Nuacha shows how much of your bucket remains.
4. Continue until you have allocated all available funds.

**Where to find it:**
Budget Builder → Category allocation section

**Pro tip:**
Start with your biggest expenses first, then fill in the smaller ones.`,
        screenshotHint: 'Category allocation interface',
        ctaButton: { label: 'Allocate Budget', path: '/budget' }
      },
      {
        id: 'step-9-5',
        title: 'Saving Your Budget Template',
        description: 'Keep your plan for ongoing tracking.',
        detailedInstructions: `Once you are happy with your allocations:

1. Give your budget a **name** (e.g., "2025 Family Budget").
2. Optionally add a **description**.
3. Click **"Save Template"**.

**What happens next:**

- Your budget is stored and can be reused.
- Nuacha tracks your actual spending against these targets.
- You will see variance reports showing where you are over or under budget.

**Where to find it:**
Budget Builder → Save Template button

**Pro tip:**
Review and adjust your budget every few months as your income or priorities change.`,
        screenshotHint: 'Save budget template button',
        ctaButton: { label: 'Save Budget', path: '/budget' }
      }
    ]
  },
  {
    id: 'budget-dashboard',
    title: 'Budget Dashboard',
    description: 'Track spending against your plan',
    icon: 'BarChart3',
    estimatedTime: '3 min',
    track: 'Budgeting & Insights',
    level: 'Intermediate',
    tags: ['budget', 'tracking', 'dashboard'],
    prerequisites: ['building-budget'],
    steps: [
      {
        id: 'step-10-1',
        title: 'Dashboard Overview',
        description: 'Your financial snapshot.',
        detailedInstructions: `The Budget Dashboard shows:

**Income Summary:**
- Total income for the period
- Active income sources

**Budget vs Actual:**
- How much you budgeted per category
- How much you have actually spent
- Remaining budget or overspending

**Visual indicators:**
- Green: Under budget
- Yellow: Close to limit (80-100%)
- Red: Over budget

**Where to find it:**
Budget page → Dashboard tab

**Pro tip:**
Check your dashboard weekly to stay on track.`,
        screenshotHint: 'Budget dashboard with visual indicators',
        ctaButton: { label: 'View Dashboard', path: '/budget' }
      },
      {
        id: 'step-10-2',
        title: 'Budget vs Actual',
        description: 'Compare planned spending to reality.',
        detailedInstructions: `For each category, you will see:

- **Budgeted amount**: What you planned to spend
- **Actual amount**: What you have spent so far
- **Remaining**: How much budget is left
- **Percentage used**: Visual progress bar

**How to read it:**

- If Actual < Budgeted: You are doing great
- If Actual = Budgeted: Right on track
- If Actual > Budgeted: Time to review that category

**Where to find it:**
Dashboard → Budget vs Actual comparison

**Pro tip:**
Focus on the categories where you are consistently over budget.`,
        screenshotHint: 'Budget vs actual comparison table',
        ctaButton: { label: 'Compare Spending', path: '/budget' }
      },
      {
        id: 'step-10-3',
        title: 'Variance Tracking',
        description: 'Understand where you are over or under.',
        detailedInstructions: `Variance shows the difference between budget and actual:

**Positive variance** (surplus):
- You spent less than planned.
- Great for savings or reallocation.

**Negative variance** (deficit):
- You spent more than planned.
- Consider adjusting future budgets or cutting back.

**Where to find it:**
Dashboard → Variance column shows +/- amounts

**Pro tip:**
Small variances are normal. Focus on patterns across multiple months.`,
        screenshotHint: 'Variance column in dashboard',
        ctaButton: { label: 'View Variance', path: '/budget' }
      },
      {
        id: 'step-10-4',
        title: 'Scenario Planning',
        description: 'What-if analysis for future spending.',
        detailedInstructions: `Test different spending scenarios:

**How it works:**

1. Navigate to the **Scenario Planner** section.
2. Adjust income or expenses hypothetically.
3. See how changes impact your overall budget.

**Use cases:**

- "What if I get a raise?"
- "What if childcare costs increase?"
- "Can I afford a new car payment?"

**Where to find it:**
Budget page → Scenario Planner

**Pro tip:**
Scenarios do not affect your actual budget until you save them.`,
        screenshotHint: 'Scenario planner interface',
        ctaButton: { label: 'Plan Scenarios', path: '/budget' }
      }
    ]
  },
  {
    id: 'generating-reports',
    title: 'Generating Reports',
    description: 'Export and analyze your spending data',
    icon: 'FileText',
    estimatedTime: '3 min',
    track: 'Budgeting & Insights',
    level: 'Intermediate',
    tags: ['reports', 'export', 'analysis'],
    steps: [
      {
        id: 'step-11-1',
        title: 'Accessing Reports',
        description: 'Where to generate spending reports.',
        detailedInstructions: `**How to get there:**

1. Click **Reports** in the navigation bar.
2. You will see the Reports page with filtering options.

**What reports can do:**

- Summarize spending by category, family, or date range.
- Show trends over time.
- Export data for taxes or record-keeping.

**Where to find it:**
Reports page (in main navigation)

**Pro tip:**
Generate monthly reports for a clear view of spending patterns.`,
        screenshotHint: 'Reports page overview',
        ctaButton: { label: 'Open Reports', path: '/reports' }
      },
      {
        id: 'step-11-2',
        title: 'Exporting Data',
        description: 'Download your expenses as a file.',
        detailedInstructions: `**Export options:**

1. **CSV format**: Open in Excel or Google Sheets
2. **PDF format**: Print or share as document
3. **Email report**: Send to yourself or accountant

**How to export:**

1. Set your filters (date range, family, category).
2. Click **"Export"** or **"Download Report"**.
3. Choose your format.
4. Save the file to your device.

**What is included:**

- All expenses matching your filters
- Receipt images (if PDF)
- Category breakdowns
- Summary totals

**Where to find it:**
Reports page → Export button

**Pro tip:**
Keep monthly exports for year-end tax preparation.`,
        screenshotHint: 'Export button and format options',
        ctaButton: { label: 'Export Report', path: '/reports' }
      }
    ]
  },

  // ==================== TRACK 4: ADVANCED & T&T ====================
  {
    id: 'tnt-payroll',
    title: 'T&T Payroll Calculator 🇹🇹',
    description: 'Calculate NIS contributions for Trinidad & Tobago businesses',
    icon: 'DollarSign',
    estimatedTime: '4 min',
    track: 'Advanced & T&T',
    level: 'Advanced',
    tags: ['payroll', 'trinidad', 'nis', 'tnt'],
    steps: [
      {
        id: 'step-12-1',
        title: 'About the NIS System',
        description: 'Understanding Trinidad & Tobago payroll requirements.',
        detailedInstructions: `**What is NIS?**

The National Insurance System (NIS) requires employers in Trinidad & Tobago to contribute to employee social security.

**Who needs this:**

- T&T business owners
- Employers with staff in Trinidad
- Household employers (domestic workers, caregivers)

**What Nuacha calculates:**

- Employee NIS contributions
- Employer NIS contributions
- Weekly/monthly payroll totals
- Contribution classes based on earnings

**Where to find it:**
Payroll page (in main navigation)

**Pro tip:**
This feature is 100% specific to Trinidad & Tobago regulations.`,
        screenshotHint: 'NIS payroll overview',
        ctaButton: { label: 'Open Payroll', path: '/payroll' }
      },
      {
        id: 'step-12-2',
        title: 'Adding Your First Employee',
        description: 'Set up employee records.',
        detailedInstructions: `**How to add an employee:**

1. Navigate to **Payroll** → **Employees**.
2. Click **"+ Add Employee"**.
3. Fill in the form:
   - First name and last name
   - Employee number (optional)
   - NIS number (required for official reporting)
   - Employment type (Full-time, Part-time, etc.)
   - Pay rate (hourly, daily, weekly, or monthly)
4. Click **"Save"**.

**Where to find it:**
Payroll → Employees → Add Employee button

**Pro tip:**
Keep NIS numbers accurate for official reporting.`,
        screenshotHint: 'Add employee form',
        ctaButton: { label: 'Add Employee', path: '/payroll' }
      },
      {
        id: 'step-12-3',
        title: 'Understanding NIS Rates',
        description: 'How contributions are calculated.',
        detailedInstructions: `NIS contributions are based on **weekly earnings**:

**Contribution classes:**

- Different earnings levels have different contribution rates.
- Both employee and employer contribute.
- Rates are set by the Trinidad & Tobago government.

**Nuacha handles:**

- Automatic rate lookups based on earnings
- Splitting employee vs employer contributions
- Weekly and monthly totals

**What you need to do:**

- Enter hours worked or pay amounts
- Nuacha calculates the rest

**Where to find it:**
Payroll → NIS Rates section

**Pro tip:**
Rates are updated when government regulations change.`,
        screenshotHint: 'NIS rates table',
        ctaButton: { label: 'View Rates', path: '/payroll' }
      }
    ]
  },
  {
    id: 'managing-categories',
    title: 'Managing Categories',
    description: 'Customize expense categories for your needs',
    icon: 'FolderTree',
    estimatedTime: '2 min',
    track: 'Advanced & T&T',
    level: 'Advanced',
    tags: ['categories', 'customization'],
    steps: [
      {
        id: 'step-13-1',
        title: 'Accessing Category Settings',
        description: 'Where to manage your categories.',
        detailedInstructions: `**How to get there:**

1. Click **Settings** (or the gear icon).
2. Go to the **"Categories"** tab.

**What you will see:**

- All your existing categories
- Default categories provided by Nuacha
- Custom categories you have created

**Where to find it:**
Settings → Categories tab

**Pro tip:**
Review categories before creating new ones to avoid duplicates.`,
        screenshotHint: 'Settings categories tab',
        ctaButton: { label: 'Manage Categories', path: '/options?tab=categories' }
      },
      {
        id: 'step-13-2',
        title: 'Adding Custom Categories',
        description: 'Create categories specific to your family.',
        detailedInstructions: `**How to create:**

1. Click **"+ Add Category"**.
2. Enter a **name** (e.g., "Pet Care", "Garden Supplies").
3. Choose a **color** for visual identification.
4. Optionally select a **parent category** to create subcategories.
5. Click **"Save"**.

**Use cases:**

- Track niche expenses unique to your household
- Break down broad categories into specifics (e.g., "Healthcare" → "Prescriptions", "Doctor Visits")

**Where to find it:**
Categories tab → Add Category button

**Pro tip:**
Use descriptive names that make sense to your whole family.`,
        screenshotHint: 'Add category form',
        ctaButton: { label: 'Add Category', path: '/options?tab=categories' }
      },
      {
        id: 'step-13-3',
        title: 'Category Colors',
        description: 'Visual organization with color coding.',
        detailedInstructions: `Each category has a color that appears:

- On expense cards
- In charts and graphs
- In budget breakdowns

**How to change colors:**

1. Find the category in the list.
2. Click the color swatch or edit icon.
3. Pick a new color from the palette.
4. Save your changes.

**Where to find it:**
Categories tab → Click category color swatch

**Pro tip:**
Use similar colors for related categories (e.g., shades of blue for all home-related expenses).`,
        screenshotHint: 'Category color picker',
        ctaButton: { label: 'Edit Colors', path: '/options?tab=categories' }
      }
    ]
  }
];
