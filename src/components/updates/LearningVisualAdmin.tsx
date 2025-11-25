import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Image, Loader2 } from 'lucide-react';
import { learningModules } from '@/constants/learningCenterData';
import { useLearningVisualGenerator } from '@/hooks/useLearningVisualGenerator';
import { checkVisualExists } from '@/utils/learningVisuals';
import { toast } from 'sonner';

type VisualStatus = 'exists' | 'missing' | 'generating';

export function LearningVisualAdmin() {
  const { generateVisual, generateBatchVisuals, isGenerating } = useLearningVisualGenerator();
  const [visualStatus, setVisualStatus] = useState<Map<string, VisualStatus>>(new Map());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  // Check which visuals already exist
  useEffect(() => {
    checkAllVisualsExist();
  }, []);

  const checkAllVisualsExist = async () => {
    const statusMap = new Map<string, VisualStatus>();
    
    for (const module of learningModules) {
      for (const step of module.steps) {
        const key = `${module.id}-${step.id}`;
        const exists = await checkVisualExists(module.id, step.id, 'ai-generated');
        statusMap.set(key, exists ? 'exists' : 'missing');
      }
    }
    
    setVisualStatus(statusMap);
  };

  const handleGenerateSingle = async (moduleId: string, stepId: string, title: string, description: string, screenshotHint?: string) => {
    const key = `${moduleId}-${stepId}`;
    
    // Update status to generating
    setVisualStatus(prev => new Map(prev).set(key, 'generating'));
    
    const url = await generateVisual({
      moduleId,
      stepId,
      title,
      description,
      screenshotHint
    });
    
    // Update status based on result
    setVisualStatus(prev => new Map(prev).set(key, url ? 'exists' : 'missing'));
  };

  const handleGenerateModule = async (moduleId: string) => {
    const module = learningModules.find(m => m.id === moduleId);
    if (!module) return;

    // Mark all steps in module as generating
    const updatedStatus = new Map(visualStatus);
    module.steps.forEach(step => {
      const key = `${moduleId}-${step.id}`;
      if (visualStatus.get(key) !== 'exists') {
        updatedStatus.set(key, 'generating');
      }
    });
    setVisualStatus(updatedStatus);

    // Generate missing visuals for this module
    const stepsToGenerate = module.steps
      .filter(step => visualStatus.get(`${moduleId}-${step.id}`) !== 'exists')
      .map(step => ({
        moduleId,
        stepId: step.id,
        step
      }));

    const results = await generateBatchVisuals(stepsToGenerate);

    // Update status based on results
    const finalStatus = new Map(visualStatus);
    stepsToGenerate.forEach(step => {
      const key = `${step.moduleId}-${step.stepId}`;
      const url = results.get(key);
      finalStatus.set(key, url ? 'exists' : 'missing');
    });
    setVisualStatus(finalStatus);
  };

  const handleGenerateAllMissing = async () => {
    const allMissingSteps = learningModules.flatMap(module =>
      module.steps
        .filter(step => visualStatus.get(`${module.id}-${step.id}`) !== 'exists')
        .map(step => ({
          moduleId: module.id,
          stepId: step.id,
          step
        }))
    );

    if (allMissingSteps.length === 0) {
      toast.success('All visuals already exist!');
      return;
    }

    // Mark all as generating
    const updatedStatus = new Map(visualStatus);
    allMissingSteps.forEach(step => {
      updatedStatus.set(`${step.moduleId}-${step.stepId}`, 'generating');
    });
    setVisualStatus(updatedStatus);

    const results = await generateBatchVisuals(allMissingSteps, (current, total) => {
      toast.info(`Generating visuals: ${current}/${total}`);
    });

    // Update final status
    const finalStatus = new Map(visualStatus);
    allMissingSteps.forEach(step => {
      const key = `${step.moduleId}-${step.stepId}`;
      const url = results.get(key);
      finalStatus.set(key, url ? 'exists' : 'missing');
    });
    setVisualStatus(finalStatus);
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const missingCount = Array.from(visualStatus.values()).filter(s => s === 'missing').length;
  const totalCount = learningModules.reduce((acc, m) => acc + m.steps.length, 0);
  const existsCount = Array.from(visualStatus.values()).filter(s => s === 'exists').length;

  return (
    <div className="space-y-6">
      {/* Header with bulk action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Image className="w-6 h-6" />
            Learning Visual Generator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {existsCount}/{totalCount} visuals generated • {missingCount} missing
          </p>
        </div>
        <Button 
          onClick={handleGenerateAllMissing} 
          disabled={isGenerating || missingCount === 0}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate All Missing ({missingCount})
            </>
          )}
        </Button>
      </div>

      {/* Module list */}
      <div className="space-y-4">
        {learningModules.map(module => {
          const moduleStepsTotal = module.steps.length;
          const moduleStepsExists = module.steps.filter(
            step => visualStatus.get(`${module.id}-${step.id}`) === 'exists'
          ).length;
          const isOpen = openModules.has(module.id);

          return (
            <Card key={module.id}>
              <Collapsible open={isOpen} onOpenChange={() => toggleModule(module.id)}>
                <CardHeader className="cursor-pointer" onClick={() => toggleModule(module.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown 
                              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {moduleStepsExists}/{moduleStepsTotal} steps completed
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateModule(module.id);
                      }}
                      disabled={isGenerating || moduleStepsExists === moduleStepsTotal}
                      className="gap-2"
                    >
                      Generate Module
                    </Button>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent>
                    {module.steps.map((step, idx) => {
                      const key = `${module.id}-${step.id}`;
                      const status = visualStatus.get(key) || 'missing';

                      return (
                        <div 
                          key={step.id} 
                          className="flex items-center justify-between py-3 border-b last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">
                              {idx + 1}. {step.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              variant={status === 'exists' ? 'default' : status === 'generating' ? 'secondary' : 'outline'}
                              className="gap-1"
                            >
                              {status === 'exists' && '✅'}
                              {status === 'generating' && <Loader2 className="w-3 h-3 animate-spin" />}
                              {status === 'missing' && '❌'}
                              <span className="capitalize">{status}</span>
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGenerateSingle(
                                module.id, 
                                step.id, 
                                step.title, 
                                step.description,
                                step.screenshotHint
                              )}
                              disabled={isGenerating}
                            >
                              Generate
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
