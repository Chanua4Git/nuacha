import { useState, useEffect } from 'react';

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
