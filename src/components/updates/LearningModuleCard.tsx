import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Clock, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { LearningModule } from '@/constants/learningCenterData';
import { LearningStepCard } from './LearningStepCard';
import { useLearningProgress } from '@/hooks/useLearningProgress';

interface LearningModuleCardProps {
  module: LearningModule;
}

export function LearningModuleCard({ module }: LearningModuleCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    getModuleProgress,
    markStepComplete,
    markStepIncomplete,
    isStepCompleted,
    markModuleComplete,
    markModuleIncomplete
  } = useLearningProgress();

  const progress = getModuleProgress(module.id, module.steps.length);
  const IconComponent = Icons[module.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  const handleModuleToggle = () => {
    if (progress.completed) {
      markModuleIncomplete(module.id);
    } else {
      markModuleComplete(module.id);
    }
  };

  const handleStepToggle = (stepId: string) => {
    if (isStepCompleted(module.id, stepId)) {
      markStepIncomplete(module.id, stepId);
    } else {
      markStepComplete(module.id, stepId);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              {IconComponent && <IconComponent className="w-6 h-6 text-primary" />}
            </div>

            {/* Header Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground mb-1 flex items-center gap-2">
                    {module.title}
                    {progress.completed && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                  
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="w-3 h-3" />
                      {module.estimatedTime}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {module.level}
                    </Badge>
                    {module.tags?.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {progress.completedCount} of {progress.totalSteps} steps completed
                  </span>
                  <span className="font-medium">{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-3">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {isOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide Steps
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {progress.completedCount > 0 ? 'Continue' : 'Start'}
                  </>
                )}
              </Button>
            </CollapsibleTrigger>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleModuleToggle}
              className="gap-2"
            >
              {progress.completed ? (
                <>
                  <Check className="w-4 h-4" />
                  Completed
                </>
              ) : (
                'Mark Complete'
              )}
            </Button>
          </div>

          {/* Steps List */}
          <CollapsibleContent className="space-y-3">
            {module.steps.map((step, index) => (
              <LearningStepCard
                key={step.id}
                step={step}
                stepNumber={index + 1}
                moduleId={module.id}
                isCompleted={isStepCompleted(module.id, step.id)}
                onToggleComplete={() => handleStepToggle(step.id)}
              />
            ))}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
