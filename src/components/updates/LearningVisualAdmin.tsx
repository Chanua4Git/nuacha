import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Image, Loader2, Upload, Camera } from 'lucide-react';
import { learningModules } from '@/constants/learningCenterData';
import { useLearningVisualGenerator } from '@/hooks/useLearningVisualGenerator';
import { checkVisualExists, uploadLearningVisual, getLearningVisualUrl } from '@/utils/learningVisuals';
import { toast } from 'sonner';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScreenshotAnnotationEditor } from './ScreenshotAnnotationEditor';
import { CapturePreviewPanel } from './CapturePreviewPanel';
import { GifRecordingPanel } from './GifRecordingPanel';
import { GifEditor } from './GifEditor';

type VisualStatus = 'exists' | 'missing' | 'generating' | 'uploading' | 'recording';
type VisualType = 'gif' | 'screenshot' | 'ai-generated' | 'missing';

export function LearningVisualAdmin() {
  const { generateVisual, generateBatchVisuals, isGenerating } = useLearningVisualGenerator();
  const [visualStatus, setVisualStatus] = useState<Map<string, VisualStatus>>(new Map());
  const [visualTypes, setVisualTypes] = useState<Map<string, VisualType>>(new Map());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [annotatingStep, setAnnotatingStep] = useState<{
    file: File;
    moduleId: string;
    stepId: string;
    stepTitle: string;
  } | null>(null);
  const [previewingStep, setPreviewingStep] = useState<{
    moduleId: string;
    stepId: string;
    stepTitle: string;
    targetPath: string;
    moduleTitle: string;
    moduleTrack: string;
    stepDescription: string;
    screenshotHint?: string;
    detailedInstructions?: string;
    stepNumber: number;
    totalSteps: number;
  } | null>(null);
  const [recordingStep, setRecordingStep] = useState<{
    moduleId: string;
    stepId: string;
    stepTitle: string;
    targetPath: string;
    moduleTitle: string;
    moduleTrack: string;
    stepDescription: string;
    screenshotHint?: string;
    detailedInstructions?: string;
    stepNumber: number;
    totalSteps: number;
  } | null>(null);
  const [editingGif, setEditingGif] = useState<{
    blob: Blob;
    moduleId: string;
    stepId: string;
    stepTitle: string;
  } | null>(null);

  // Check which visuals already exist
  useEffect(() => {
    checkAllVisualsExist();
  }, []);

  const checkAllVisualsExist = async () => {
    const statusMap = new Map<string, VisualStatus>();
    const typeMap = new Map<string, VisualType>();
    
    for (const module of learningModules) {
      for (const step of module.steps) {
        const key = `${module.id}-${step.id}`;
        
        // Check for GIF first (highest priority)
        const hasGif = await checkVisualExists(module.id, step.id, 'gif', 'gif');
        if (hasGif) {
          statusMap.set(key, 'exists');
          typeMap.set(key, 'gif');
          continue;
        }
        
        // Check for screenshot second
        const hasScreenshot = await checkVisualExists(module.id, step.id, 'screenshot');
        if (hasScreenshot) {
          statusMap.set(key, 'exists');
          typeMap.set(key, 'screenshot');
          continue;
        }
        
        // Check for AI-generated third
        const hasAI = await checkVisualExists(module.id, step.id, 'ai-generated');
        if (hasAI) {
          statusMap.set(key, 'exists');
          typeMap.set(key, 'ai-generated');
          continue;
        }
        
        // None exist
        statusMap.set(key, 'missing');
        typeMap.set(key, 'missing');
      }
    }
    
    setVisualStatus(statusMap);
    setVisualTypes(typeMap);
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
    if (url) {
      setVisualStatus(prev => new Map(prev).set(key, 'exists'));
      setVisualTypes(prev => new Map(prev).set(key, 'ai-generated'));
    } else {
      setVisualStatus(prev => new Map(prev).set(key, 'missing'));
    }
  };

  const handleFileSelect = (moduleId: string, stepId: string) => {
    const key = `${moduleId}-${stepId}`;
    const input = fileInputRefs.current.get(key);
    input?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    moduleId: string,
    stepId: string,
    stepTitle: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a GIF
    const isGif = file.type === 'image/gif';
    const isImage = file.type.startsWith('image/') && !isGif;

    // Validate file type
    if (!isImage && !isGif) {
      toast.error('Invalid file type. Please upload an image file (PNG, JPG, WebP, GIF)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Please upload an image smaller than 5MB');
      return;
    }

    // For GIFs, upload directly without annotation
    if (isGif) {
      const key = `${moduleId}-${stepId}`;
      setVisualStatus(prev => new Map(prev).set(key, 'uploading'));
      setVisualTypes(prev => new Map(prev).set(key, 'gif'));
      
      try {
        await uploadLearningVisual(file, moduleId, stepId, 'gif');
        setVisualStatus(prev => new Map(prev).set(key, 'exists'));
        toast.success('GIF uploaded successfully!');
      } catch (error) {
        setVisualStatus(prev => new Map(prev).set(key, 'missing'));
        toast.error('Failed to upload GIF');
      }
      
      event.target.value = '';
      return;
    }

    // For images, open annotation editor
    setAnnotatingStep({ file, moduleId, stepId, stepTitle });

    // Reset input
    event.target.value = '';
  };

  const handleAnnotationSave = async (annotatedBlob: Blob) => {
    if (!annotatingStep) return;

    const { moduleId, stepId, stepTitle } = annotatingStep;
    const key = `${moduleId}-${stepId}`;
    
    setVisualStatus(prev => new Map(prev).set(key, 'uploading'));
    setAnnotatingStep(null);

    try {
      const url = await uploadLearningVisual(annotatedBlob, moduleId, stepId, 'screenshot');
      
      if (url) {
        setVisualStatus(prev => new Map(prev).set(key, 'exists'));
        setVisualTypes(prev => new Map(prev).set(key, 'screenshot'));
        toast.success(`Annotated screenshot saved for "${stepTitle}"`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setVisualStatus(prev => new Map(prev).set(key, 'missing'));
      toast.error('Failed to upload screenshot. Please try again.');
    }
  };

  const handleCaptureFromPreview = (imageBlob: Blob) => {
    if (!previewingStep) return;

    // Convert blob to File for annotation editor
    const file = new File([imageBlob], `${previewingStep.stepId}-capture.png`, {
      type: 'image/png',
    });

    setAnnotatingStep({
      file,
      moduleId: previewingStep.moduleId,
      stepId: previewingStep.stepId,
      stepTitle: previewingStep.stepTitle,
    });

    setPreviewingStep(null);
  };

  const handleGifRecordingComplete = (gifBlob: Blob) => {
    console.log('=== handleGifRecordingComplete called ===');
    console.log('gifBlob:', gifBlob, 'size:', gifBlob?.size);
    console.log('recordingStep:', recordingStep);
    
    if (!recordingStep) {
      console.error('❌ recordingStep is null - returning early!');
      return;
    }

    console.log('✅ Setting editingGif state...');
    setEditingGif({
      blob: gifBlob,
      moduleId: recordingStep.moduleId,
      stepId: recordingStep.stepId,
      stepTitle: recordingStep.stepTitle,
    });

    console.log('✅ Setting recordingStep to null (closing recording panel)...');
    setRecordingStep(null);
  };

  const handleGifSave = async (editedBlob: Blob) => {
    if (!editingGif) return;

    const { moduleId, stepId, stepTitle } = editingGif;
    const key = `${moduleId}-${stepId}`;
    
    setVisualStatus(prev => new Map(prev).set(key, 'uploading'));
    setEditingGif(null);

    try {
      const url = await uploadLearningVisual(editedBlob, moduleId, stepId, 'gif');
      
      if (url) {
        setVisualStatus(prev => new Map(prev).set(key, 'exists'));
        setVisualTypes(prev => new Map(prev).set(key, 'gif'));
        toast.success(`GIF saved for "${stepTitle}"`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setVisualStatus(prev => new Map(prev).set(key, 'missing'));
      toast.error('Failed to upload GIF. Please try again.');
    }
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
                      const type = visualTypes.get(key) || 'missing';
                      const isProcessing = status === 'generating' || status === 'uploading';

                      return (
                        <div 
                          key={step.id} 
                          className="flex items-center justify-between py-3 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-sm font-medium">
                              {idx + 1}. {step.title}
                            </span>
                            {/* Preview thumbnail for existing visuals */}
                            {status === 'exists' && (
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <img 
                                    src={getLearningVisualUrl(
                                      module.id, 
                                      step.id, 
                                      type === 'missing' ? 'ai-generated' : type,
                                      type === 'gif' ? 'gif' : 'png'
                                    )}
                                    alt={`${step.title} preview`}
                                    className="h-8 w-12 object-cover rounded border border-border cursor-pointer"
                                  />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 p-2" side="right">
                                  <img 
                                    src={getLearningVisualUrl(
                                      module.id, 
                                      step.id, 
                                      type === 'missing' ? 'ai-generated' : type,
                                      type === 'gif' ? 'gif' : 'png'
                                    )}
                                    alt={`${step.title} full preview`}
                                    className="w-full rounded"
                                  />
                                  <p className="text-xs text-muted-foreground mt-2 text-center">
                                    {type === 'gif' ? '🎬 Animated GIF' : type === 'screenshot' ? '📸 Screenshot' : '🎨 AI Generated'}
                                  </p>
                                </HoverCardContent>
                              </HoverCard>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              variant={status === 'exists' ? 'default' : isProcessing ? 'secondary' : 'outline'}
                              className="gap-1"
                            >
                              {status === 'exists' && type === 'gif' && '🎬'}
                              {status === 'exists' && type === 'screenshot' && '📸'}
                              {status === 'exists' && type === 'ai-generated' && '🎨'}
                              {status === 'uploading' && <Loader2 className="w-3 h-3 animate-spin" />}
                              {status === 'generating' && <Loader2 className="w-3 h-3 animate-spin" />}
                              {status === 'recording' && <Loader2 className="w-3 h-3 animate-spin" />}
                              {status === 'missing' && '❌'}
                              <span className="capitalize">
                                {status === 'exists' ? type : status}
                              </span>
                            </Badge>
                             <input
                              ref={(el) => {
                                if (el) fileInputRefs.current.set(key, el);
                              }}
                              type="file"
                              accept="image/*,.gif"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, module.id, step.id, step.title)}
                            />
                            {step.ctaButton?.path && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => setRecordingStep({
                                  moduleId: module.id,
                                  stepId: step.id,
                                  stepTitle: step.title,
                                  targetPath: step.ctaButton!.path,
                                  moduleTitle: module.title,
                                  moduleTrack: module.track,
                                  stepDescription: step.description,
                                  screenshotHint: step.screenshotHint,
                                  detailedInstructions: step.detailedInstructions,
                                  stepNumber: idx + 1,
                                  totalSteps: module.steps.length,
                                })}
                                disabled={isProcessing}
                                className="gap-1"
                              >
                                <Camera className="w-3 h-3" />
                                🎬 Record GIF
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleFileSelect(module.id, step.id)}
                              disabled={isProcessing}
                              className="gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              Upload
                            </Button>

                            {step.ctaButton?.path && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPreviewingStep({
                                  moduleId: module.id,
                                  stepId: step.id,
                                  stepTitle: step.title,
                                  targetPath: step.ctaButton!.path,
                                  moduleTitle: module.title,
                                  moduleTrack: module.track,
                                  stepDescription: step.description,
                                  screenshotHint: step.screenshotHint,
                                  detailedInstructions: step.detailedInstructions,
                                  stepNumber: idx + 1,
                                  totalSteps: module.steps.length,
                                })}
                                disabled={isProcessing}
                                className="gap-1"
                              >
                                <Camera className="w-3 h-3" />
                                Preview
                              </Button>
                            )}
                            
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
                              disabled={isProcessing}
                              className="gap-1"
                            >
                              <Image className="w-3 h-3" />
                              AI
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

      {annotatingStep && (
        <ScreenshotAnnotationEditor
          imageFile={annotatingStep.file}
          moduleId={annotatingStep.moduleId}
          stepId={annotatingStep.stepId}
          stepTitle={annotatingStep.stepTitle}
          onSave={handleAnnotationSave}
          onCancel={() => setAnnotatingStep(null)}
        />
      )}

      {previewingStep && (
        <CapturePreviewPanel
          open={!!previewingStep}
          onClose={() => setPreviewingStep(null)}
          targetPath={previewingStep.targetPath}
          stepTitle={previewingStep.stepTitle}
          moduleTitle={previewingStep.moduleTitle}
          moduleTrack={previewingStep.moduleTrack}
          stepDescription={previewingStep.stepDescription}
          screenshotHint={previewingStep.screenshotHint}
          detailedInstructions={previewingStep.detailedInstructions}
          stepNumber={previewingStep.stepNumber}
          totalSteps={previewingStep.totalSteps}
          onCapture={handleCaptureFromPreview}
        />
      )}

      {recordingStep && (
        <GifRecordingPanel
          open={!!recordingStep}
          onClose={() => setRecordingStep(null)}
          targetPath={recordingStep.targetPath}
          stepTitle={recordingStep.stepTitle}
          moduleTitle={recordingStep.moduleTitle}
          moduleTrack={recordingStep.moduleTrack}
          stepDescription={recordingStep.stepDescription}
          screenshotHint={recordingStep.screenshotHint}
          detailedInstructions={recordingStep.detailedInstructions}
          stepNumber={recordingStep.stepNumber}
          totalSteps={recordingStep.totalSteps}
          onRecordingComplete={handleGifRecordingComplete}
        />
      )}

      {editingGif && (
        <GifEditor
          open={!!editingGif}
          gifBlob={editingGif.blob}
          onSave={handleGifSave}
          onCancel={() => setEditingGif(null)}
        />
      )}
    </div>
  );
}
