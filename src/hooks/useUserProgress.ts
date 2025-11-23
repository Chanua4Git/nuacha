import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Users, Receipt, UserPlus, FolderKanban, Bell, Calculator, BarChart3, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface UserProgress {
  families_count: number;
  expenses_count: number;
  members_count: number;
  categories_count: number;
  reminders_count: number;
  budgets_count: number;
  receipts_count: number;
  income_sources_count: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: LucideIcon;
  count?: number;
  priority: number;
}

export interface ProgressStatus {
  completed: Task[];
  inProgress: Task[];
  nextSteps: Task[];
  totalTasks: number;
  loading: boolean;
}

interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  link: string;
  icon: LucideIcon;
  condition: (data: UserProgress) => boolean;
  inProgressCondition?: (data: UserProgress) => boolean;
  priority: number;
  dependsOn?: string[];
  getCount?: (data: UserProgress) => number;
}

const taskDefinitions: TaskDefinition[] = [
  {
    id: 'create_family',
    title: 'Create your first family',
    description: 'Set up a family to organize expenses',
    link: '/options?tab=families',
    icon: Users,
    condition: (data) => data.families_count > 0,
    priority: 1,
    getCount: (data) => data.families_count,
  },
  {
    id: 'add_expense',
    title: 'Add your first expense',
    description: 'Track spending by adding an expense',
    link: '/app?tab=add-expense',
    icon: Receipt,
    condition: (data) => data.expenses_count >= 3,
    inProgressCondition: (data) => data.expenses_count > 0 && data.expenses_count < 3,
    priority: 2,
    dependsOn: ['create_family'],
    getCount: (data) => data.expenses_count,
  },
  {
    id: 'scan_receipt',
    title: 'Scan a receipt',
    description: 'Upload or scan a receipt to auto-fill expense details',
    link: '/?action=scan',
    icon: Receipt,
    condition: (data) => data.receipts_count > 0,
    priority: 3,
    getCount: (data) => data.receipts_count,
  },
  {
    id: 'add_members',
    title: 'Add family members',
    description: 'Track expenses by individual family members',
    link: '/options?tab=members',
    icon: UserPlus,
    condition: (data) => data.members_count > 0,
    priority: 4,
    getCount: (data) => data.members_count,
  },
  {
    id: 'create_budget',
    title: 'Set up a budget',
    description: 'Plan and monitor spending with budgets',
    link: '/budget',
    icon: Calculator,
    condition: (data) => data.budgets_count > 0,
    priority: 5,
    getCount: (data) => data.budgets_count,
  },
  {
    id: 'add_reminder',
    title: 'Create a reminder',
    description: 'Set reminders for recurring bills or expenses',
    link: '/app?tab=expenses',
    icon: Bell,
    condition: (data) => data.reminders_count > 0,
    priority: 6,
    getCount: (data) => data.reminders_count,
  },
  {
    id: 'view_reports',
    title: 'View your reports',
    description: 'Analyze spending patterns and trends',
    link: '/reports',
    icon: BarChart3,
    condition: (data) => data.expenses_count >= 5,
    priority: 7,
  },
  {
    id: 'customize_categories',
    title: 'Customize categories',
    description: 'Create categories that match your spending habits',
    link: '/options?tab=categories',
    icon: FolderKanban,
    condition: (data) => data.categories_count > 200, // They have custom categories beyond defaults
    priority: 8,
    getCount: (data) => data.categories_count,
  },
];

export const useUserProgress = (): ProgressStatus => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressStatus>({
    completed: [],
    inProgress: [],
    nextSteps: [],
    totalTasks: taskDefinitions.length,
    loading: true,
  });

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) {
        setProgress({
          completed: [],
          inProgress: [],
          nextSteps: [],
          totalTasks: taskDefinitions.length,
          loading: false,
        });
        return;
      }

      try {
        // Fetch all counts in parallel
        const [
          { count: familiesCount },
          { count: expensesCount },
          { count: membersCount },
          { count: categoriesCount },
          { count: remindersCount },
          { count: budgetsCount },
          { count: receiptsCount },
          { count: incomeSourcesCount },
        ] = await Promise.all([
          supabase.from('families').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase
            .from('expenses')
            .select('*, families!inner(*)', { count: 'exact', head: true })
            .eq('families.user_id', user.id),
          supabase
            .from('family_members')
            .select('*, families!inner(*)', { count: 'exact', head: true })
            .eq('families.user_id', user.id),
          supabase.from('categories').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase
            .from('reminders')
            .select('*, families!inner(*)', { count: 'exact', head: true })
            .eq('families.user_id', user.id),
          supabase
            .from('budgets')
            .select('*, families!inner(*)', { count: 'exact', head: true })
            .eq('families.user_id', user.id),
          supabase
            .from('receipt_details')
            .select('*, expenses!inner(*, families!inner(*))', { count: 'exact', head: true })
            .eq('expenses.families.user_id', user.id),
          supabase
            .from('income_sources')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        const userData: UserProgress = {
          families_count: familiesCount || 0,
          expenses_count: expensesCount || 0,
          members_count: membersCount || 0,
          categories_count: categoriesCount || 0,
          reminders_count: remindersCount || 0,
          budgets_count: budgetsCount || 0,
          receipts_count: receiptsCount || 0,
          income_sources_count: incomeSourcesCount || 0,
        };

        // Classify tasks
        const completed: Task[] = [];
        const inProgress: Task[] = [];
        const nextSteps: Task[] = [];
        const completedIds = new Set<string>();

        for (const taskDef of taskDefinitions) {
          // Check dependencies
          const dependenciesMet = !taskDef.dependsOn || taskDef.dependsOn.every((depId) => completedIds.has(depId));

          if (taskDef.condition(userData)) {
            // Task is completed
            const task: Task = {
              id: taskDef.id,
              title: taskDef.title,
              description: taskDef.description,
              link: taskDef.link,
              icon: taskDef.icon,
              priority: taskDef.priority,
              count: taskDef.getCount ? taskDef.getCount(userData) : undefined,
            };
            completed.push(task);
            completedIds.add(taskDef.id);
          } else if (taskDef.inProgressCondition && taskDef.inProgressCondition(userData)) {
            // Task is in progress
            const task: Task = {
              id: taskDef.id,
              title: taskDef.title,
              description: taskDef.description,
              link: taskDef.link,
              icon: taskDef.icon,
              priority: taskDef.priority,
              count: taskDef.getCount ? taskDef.getCount(userData) : undefined,
            };
            inProgress.push(task);
          } else if (dependenciesMet) {
            // Task is a next step
            const task: Task = {
              id: taskDef.id,
              title: taskDef.title,
              description: taskDef.description,
              link: taskDef.link,
              icon: taskDef.icon,
              priority: taskDef.priority,
            };
            nextSteps.push(task);
          }
        }

        // Sort by priority and limit next steps to top 4
        completed.sort((a, b) => a.priority - b.priority);
        inProgress.sort((a, b) => a.priority - b.priority);
        nextSteps.sort((a, b) => a.priority - b.priority);
        const limitedNextSteps = nextSteps.slice(0, 4);

        setProgress({
          completed,
          inProgress,
          nextSteps: limitedNextSteps,
          totalTasks: taskDefinitions.length,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching user progress:', error);
        setProgress({
          completed: [],
          inProgress: [],
          nextSteps: [],
          totalTasks: taskDefinitions.length,
          loading: false,
        });
      }
    };

    fetchProgress();
  }, [user]);

  return progress;
};
