import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  DollarSign, 
  PieChart, 
  Target, 
  Lightbulb,
  Receipt,
  TrendingUp,
  Settings,
  Play
} from 'lucide-react';

export default function HowToUse() {
  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard',
      description: 'Get a complete overview of your monthly finances',
      tips: [
        'View total income vs expenses at a glance',
        'Monitor your budget rule compliance with color-coded alerts',
        'Track surplus or deficit for better financial planning',
        'Use month navigation to compare different periods'
      ]
    },
    {
      icon: DollarSign,
      title: 'Income Management',
      description: 'Track all your income sources with smart frequency conversion',
      tips: [
        'Add multiple income sources (job, freelance, rental, etc.)',
        'Set different frequencies (weekly, fortnightly, monthly, yearly)',
        'View monthly equivalent amounts for accurate budgeting',
        'Keep notes for each income source for better tracking'
      ]
    },
    {
      icon: PieChart,
      title: 'Expense Categories',
      description: 'Organize spending into Needs, Wants, and Savings',
      tips: [
        'Needs: Essential expenses like groceries, utilities, medication',
        'Wants: Lifestyle choices like dining out, entertainment, travel',
        'Savings: Future planning like emergency fund, investments',
        'Receipt scanner automatically categorizes new expenses'
      ]
    },
    {
      icon: Target,
      title: 'Budget Rules',
      description: 'Set and customize allocation percentages',
      tips: [
        'Start with the popular 50/30/20 rule (50% needs, 30% wants, 20% savings)',
        'Create custom rules that fit your financial situation',
        'Set one rule as active to track compliance',
        'Percentages must add up to exactly 100%'
      ]
    },
    {
      icon: Play,
      title: 'Scenario Planner',
      description: 'Test "what-if" budget adjustments',
      tips: [
        'Adjust spending in different categories using sliders',
        'See real-time impact on your budget and surplus',
        'Plan for major changes like hiring help or big purchases',
        'Save scenarios for future reference and comparison'
      ]
    }
  ];

  const workflows = [
    {
      title: 'Getting Started',
      steps: [
        'Set up your income sources with accurate amounts and frequencies',
        'Choose or create a budget rule (50/30/20 is a great starting point)',
        'Initialize default expense categories or create your own',
        'Upload receipts to automatically populate expenses',
        'Review your Dashboard to see your financial picture'
      ]
    },
    {
      title: 'Monthly Budget Review',
      steps: [
        'Check Dashboard for rule compliance and alerts',
        'Review expense categories to see where money is going',
        'Look for overspending patterns in the Wants category',
        'Adjust next month\'s plan using Scenario Planner',
        'Update income sources if there are changes'
      ]
    },
    {
      title: 'Planning Major Changes',
      steps: [
        'Use Scenario Planner to model the financial impact',
        'Adjust multiple categories to see the full effect',
        'Save the scenario with a descriptive name',
        'Share insights with family members or financial advisors',
        'Monitor actual vs planned changes over time'
      ]
    }
  ];

  const integrations = [
    {
      icon: Receipt,
      title: 'Receipt Scanner',
      description: 'Automatically extracts expense details and suggests categories based on merchant and items'
    },
    {
      icon: TrendingUp,
      title: 'Smart Analytics',
      description: 'Tracks spending patterns and provides alerts when you exceed budget thresholds'
    },
    {
      icon: Settings,
      title: 'Flexible Setup',
      description: 'Customize categories, rules, and frequencies to match your unique financial situation'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            Budget & Planning Pro Guide
          </CardTitle>
          <p className="text-muted-foreground">
            Master your family finances with intelligent budgeting tools designed for Trinidad & Tobago households
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-blue-900">Track</h3>
              <p className="text-sm text-blue-700 mt-1">Multiple income sources with smart frequency conversion</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <h3 className="font-semibold text-green-900">Organize</h3>
              <p className="text-sm text-green-700 mt-1">Expenses into Needs, Wants, and Savings categories</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
              <h3 className="font-semibold text-purple-900">Plan</h3>
              <p className="text-sm text-purple-700 mt-1">Future scenarios and budget adjustments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <feature.icon className="h-5 w-5" />
                {feature.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {feature.tips.map((tip, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Common Workflows</CardTitle>
          <p className="text-sm text-muted-foreground">
            Step-by-step guides for typical budget management tasks
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflows.map((workflow, index) => (
              <div key={index} className="space-y-3">
                <h3 className="font-semibold">{workflow.title}</h3>
                <ol className="space-y-2">
                  {workflow.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="text-sm flex gap-3">
                      <Badge variant="outline" className="min-w-[24px] h-6 flex items-center justify-center text-xs">
                        {stepIndex + 1}
                      </Badge>
                      <span className="leading-6">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Integrations</CardTitle>
          <p className="text-sm text-muted-foreground">
            How Budget Pro works with other Nuacha features
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div key={integration.title} className="text-center p-4 rounded-lg border">
                <integration.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">{integration.title}</h3>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-900">Pro Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Currency Formatting</h3>
              <p className="text-sm text-green-700">
                All amounts are displayed in Trinidad & Tobago Dollars (TTD) with proper formatting for local readability.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Frequency Conversion</h3>
              <p className="text-sm text-green-700">
                Weekly amounts are multiplied by 4.33, fortnightly by 2.165, and yearly divided by 12 for accurate monthly totals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Budget Alerts</h3>
              <p className="text-sm text-green-700">
                Red alerts appear when spending exceeds your rule by more than 5%. Green indicates you're under budget.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Data Privacy</h3>
              <p className="text-sm text-green-700">
                All your financial data is securely stored and only visible to you. No sharing without your explicit consent.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}