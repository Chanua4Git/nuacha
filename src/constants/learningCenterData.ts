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
        detailedInstructions: `The navigation bar at the top helps you move between sections.

**Where to find it:**
Top of any page → Navigation bar

**Pro tip:**
After you have signed in, bookmark /app to jump straight into your expense tracker.`,
        screenshotHint: 'Navigation bar with all menu items visible',
        ctaButton: { label: 'Explore Navigation', path: '/' }
      },
      {
        id: 'step-1-3',
        title: 'Demo Mode vs Full App',
        description: 'What you can try without an account.',
        detailedInstructions: `Nuacha lets you explore features before you create an account. With an account, you unlock saving expenses permanently, creating multiple families, and generating reports.

**Where to find demo:**
Click "Try Demo" in the navigation, or simply scan a receipt from the landing page to start.`,
        screenshotHint: 'Demo mode interface showing sample data',
        ctaButton: { label: 'Try Demo', path: '/demo' }
      }
    ]
  },
  {
    id: 'first-receipt-scan',
    title: 'Your First Receipt Scan',
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
        detailedInstructions: `Go to the home page and look at the hero section. You will see two buttons: Camera and Upload.

**Where to find it:**
Landing page → Hero section → Camera / Upload buttons

**Pro tip:**
Make sure your receipt is well-lit and the text is clear for best OCR results.`,
        screenshotHint: 'Landing page hero section highlighting upload buttons',
        ctaButton: { label: 'Go to Home', path: '/' }
      }
    ]
  }
];
