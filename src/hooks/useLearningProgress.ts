import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'nuacha_learning_progress';

interface ModuleProgress {
  completed: boolean;
  stepsCompleted: string[];
}

interface LearningProgressData {
  modules: Record<string, ModuleProgress>;
  lastVisitedModule?: string;
  lastVisitedStep?: string;
}

export function useLearningProgress() {
  const [progress, setProgress] = useState<LearningProgressData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { modules: {} };
    } catch {
      return { modules: {} };
    }
  });

  const [userId, setUserId] = useState<string | null>(null);
  const loaded = useRef(false);

  // Signed in: merge saved account progress with this browser's, once.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || cancelled) return;
      const { data } = await supabase.from('learning_progress').select('module_id, steps_completed, completed').eq('user_id', session.user.id);
      if (cancelled) return;
      setProgress(prev => {
        const modules = { ...prev.modules };
        for (const r of data ?? []) {
          const local = modules[r.module_id] || { completed: false, stepsCompleted: [] };
          modules[r.module_id] = {
            completed: local.completed || r.completed,
            stepsCompleted: Array.from(new Set([...(local.stepsCompleted || []), ...(r.steps_completed || [])])),
          };
        }
        return { ...prev, modules };
      });
      loaded.current = true;
      setUserId(session.user.id);
    });
    return () => { cancelled = true; };
  }, []);

  // Keep the account copy up to date.
  useEffect(() => {
    if (!userId || !loaded.current) return;
    const t = setTimeout(() => {
      const rows = Object.entries(progress.modules).map(([module_id, m]) => ({
        user_id: userId, module_id, steps_completed: m.stepsCompleted || [], completed: !!m.completed,
      }));
      if (rows.length) supabase.from('learning_progress').upsert(rows).then(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [progress, userId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save learning progress:', error);
    }
  }, [progress]);

  const markStepComplete = (moduleId: string, stepId: string) => {
    setProgress(prev => {
      const moduleProgress = prev.modules[moduleId] || { completed: false, stepsCompleted: [] };
      const stepsCompleted = moduleProgress.stepsCompleted.includes(stepId)
        ? moduleProgress.stepsCompleted
        : [...moduleProgress.stepsCompleted, stepId];

      return {
        ...prev,
        modules: {
          ...prev.modules,
          [moduleId]: {
            ...moduleProgress,
            stepsCompleted
          }
        },
        lastVisitedModule: moduleId,
        lastVisitedStep: stepId
      };
    });
  };

  const markStepIncomplete = (moduleId: string, stepId: string) => {
    setProgress(prev => {
      const moduleProgress = prev.modules[moduleId];
      if (!moduleProgress) return prev;

      return {
        ...prev,
        modules: {
          ...prev.modules,
          [moduleId]: {
            ...moduleProgress,
            stepsCompleted: moduleProgress.stepsCompleted.filter(id => id !== stepId),
            completed: false
          }
        }
      };
    });
  };

  const markModuleComplete = (moduleId: string) => {
    setProgress(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleId]: {
          ...prev.modules[moduleId],
          completed: true
        }
      }
    }));
  };

  const markModuleIncomplete = (moduleId: string) => {
    setProgress(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleId]: {
          ...prev.modules[moduleId],
          completed: false
        }
      }
    }));
  };

  const getModuleProgress = (moduleId: string, totalSteps: number) => {
    const moduleProgress = progress.modules[moduleId];
    if (!moduleProgress) {
      return {
        completed: false,
        stepsCompleted: [],
        completedCount: 0,
        totalSteps,
        percentage: 0
      };
    }

    const completedCount = moduleProgress.stepsCompleted.length;
    const percentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

    return {
      completed: moduleProgress.completed,
      stepsCompleted: moduleProgress.stepsCompleted,
      completedCount,
      totalSteps,
      percentage
    };
  };

  const isStepCompleted = (moduleId: string, stepId: string) => {
    const moduleProgress = progress.modules[moduleId];
    return moduleProgress?.stepsCompleted.includes(stepId) || false;
  };

  const getOverallProgress = (totalModules: number) => {
    const completedModules = Object.values(progress.modules).filter(m => m.completed).length;
    const percentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    return {
      completedModules,
      totalModules,
      percentage
    };
  };

  const resetProgress = () => {
    setProgress({ modules: {} });
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    progress,
    markStepComplete,
    markStepIncomplete,
    markModuleComplete,
    markModuleIncomplete,
    getModuleProgress,
    isStepCompleted,
    getOverallProgress,
    resetProgress
  };
}
