import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, ExternalLink, Lightbulb, Link, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { LearningStep } from '@/constants/learningCenterData';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getLearningVisualUrl, getNarratorVideoUrl, checkNarratorExists } from '@/utils/learningVisuals';
import { cn } from '@/lib/utils';
import { NarratorOverlay } from './NarratorOverlay';
import { useIsMobile } from '@/hooks/use-mobile';

interface LearningStepCardProps {
  step: LearningStep;
  stepNumber: number;
  moduleId: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
  initialExpanded?: boolean;
}

export function LearningStepCard({
  step,
  stepNumber,
  moduleId,
  isCompleted,
  onToggleComplete,
  initialExpanded = false
}: LearningStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isVisualExpanded, setIsVisualExpanded] = useState(false);
  const [hasVisual, setHasVisual] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [visualUrl, setVisualUrl] = useState<string>('');
  const [hasNarrator, setHasNarrator] = useState(false);
  const [narratorUrl, setNarratorUrl] = useState<string>('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check for visuals and narrator on mount
  useState(() => {
    const checkAndSetVisual = async () => {
      // Check for GIF first (highest priority) - stored as .webm
      const gifUrl = getLearningVisualUrl(moduleId, step.id, 'gif', 'webm');
      const gifVideo = document.createElement('video');
      gifVideo.src = gifUrl;
      
      const gifExists = await new Promise((resolve) => {
        gifVideo.onloadeddata = () => resolve(true);
        gifVideo.onerror = () => resolve(false);
      });
      
      if (gifExists) {
        setVisualUrl(gifUrl);
        setHasVisual(true);
        return;
      }
      
      // Check for screenshot second
      const screenshotUrl = getLearningVisualUrl(moduleId, step.id, 'screenshot');
      const screenshotImg = new Image();
      screenshotImg.src = screenshotUrl;
      
      const screenshotExists = await new Promise((resolve) => {
        screenshotImg.onload = () => resolve(true);
        screenshotImg.onerror = () => resolve(false);
      });
      
      if (screenshotExists) {
        setVisualUrl(screenshotUrl);
        setHasVisual(true);
        return;
      }
      
      // Check for AI-generated third
      const aiUrl = getLearningVisualUrl(moduleId, step.id, 'ai-generated');
      const aiImg = new Image();
      aiImg.src = aiUrl;
      
      const aiExists = await new Promise((resolve) => {
        aiImg.onload = () => resolve(true);
        aiImg.onerror = () => resolve(false);
      });
      
      if (aiExists) {
        setVisualUrl(aiUrl);
        setHasVisual(true);
        return;
      }
      
      // Use custom visual URL if provided
      if (step.visual?.url) {
        setVisualUrl(step.visual.url);
        setHasVisual(true);
      }
    };
    
    const checkNarrator = async () => {
      const extension = await checkNarratorExists(moduleId, step.id);
      if (extension) {
        setHasNarrator(true);
        setNarratorUrl(getNarratorVideoUrl(moduleId, step.id, extension));
      }
    };
    
    checkAndSetVisual();
    checkNarrator();
  });

  const handleCTAClick = () => {
    if (step.ctaButton?.path) {
      navigate(step.ctaButton.path);
    }
  };

  const handleCopyStepLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/updates?tab=learning&module=${moduleId}&step=${step.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Step link copied!');
  };

  // Extract "Where to find it" and "Pro tip" from markdown
  const sections = step.detailedInstructions.split('\n\n');
  const mainContent = sections.filter(s => 
    !s.toLowerCase().includes('where to find it') && 
    !s.toLowerCase().includes('pro tip')
  ).join('\n\n');
  
  const whereToFind = sections.find(s => s.toLowerCase().includes('where to find it'));
  const proTip = sections.find(s => s.toLowerCase().includes('pro tip'));

  return (
    <Card className="border-l-4 border-l-primary/30 hover:border-l-primary transition-colors">
      <CardContent className="p-2 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Step Number */}
          <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs sm:text-sm">
            {stepNumber}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                  {step.title}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyStepLink}
                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                    title="Copy link to this step"
                  >
                    <Link className="w-3 h-3" />
                  </Button>
                </h4>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              
              <Checkbox
                checked={isCompleted}
                onCheckedChange={onToggleComplete}
                className="mt-1"
              />
            </div>

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-3 text-xs gap-2 -ml-3 mb-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show details
                </>
              )}
            </Button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="space-y-4 mt-3 pt-3 border-t">
                {/* Visual Content */}
                {imageLoading && <Skeleton className="w-full h-40 rounded-lg" />}
                <div className={cn(
                  "relative w-full rounded-lg sm:rounded-lg border border-border bg-muted/30 overflow-hidden",
                  "mx-[-8px] sm:mx-0 w-[calc(100%+16px)] sm:w-full",
                  !hasVisual && "hidden"
                )}>
                  {visualUrl.endsWith('.webm') || visualUrl.includes('/gif/') ? (
                    <video 
                      src={visualUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full max-h-72 md:max-h-80 lg:max-h-96 object-contain mx-auto"
                      onLoadedData={() => { 
                        setHasVisual(true); 
                        setImageLoading(false); 
                      }}
                      onError={() => { 
                        setHasVisual(false); 
                        setImageLoading(false); 
                      }}
                    />
                  ) : (
                    <img 
                      src={visualUrl}
                      alt={step.visual?.alt || step.title}
                      className="w-full max-h-72 md:max-h-80 lg:max-h-96 object-contain mx-auto"
                      onLoad={() => { 
                        setHasVisual(true); 
                        setImageLoading(false); 
                      }}
                      onError={() => { 
                        setHasVisual(false); 
                        setImageLoading(false); 
                      }}
                    />
                  )}
                  
                  {/* Expand Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsVisualExpanded(true)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow"
                    title="View fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  
                  {/* Narrator Overlay - Only on desktop */}
                  {!isMobile && hasNarrator && narratorUrl && (
                    <NarratorOverlay
                      videoUrl={narratorUrl}
                      displayMode={step.narrator?.displayMode || 'face-voice'}
                    />
                  )}
                </div>

                {/* Narrator - Below visual on mobile */}
                {isMobile && hasNarrator && narratorUrl && (
                  <NarratorOverlay
                    videoUrl={narratorUrl}
                    displayMode={step.narrator?.displayMode || 'face-voice'}
                    isMobile={true}
                  />
                )}

                {/* Fullscreen Dialog */}
                <Dialog open={isVisualExpanded} onOpenChange={setIsVisualExpanded}>
                  <DialogContent className="max-w-[95vw] max-h-[90vh] p-2">
                    {visualUrl.endsWith('.webm') || visualUrl.includes('/gif/') ? (
                      <video 
                        src={visualUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img 
                        src={visualUrl}
                        alt={step.visual?.alt || step.title}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </DialogContent>
                </Dialog>

                {/* Main Instructions */}
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <ReactMarkdown>{mainContent}</ReactMarkdown>
                </div>

                {/* Where to Find It */}
                {whereToFind && (
                  <div className="bg-accent/30 rounded-lg p-3 border border-accent">
                    <div className="flex items-start gap-2">
                      <ExternalLink className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-accent-foreground mb-1">Where to find it:</p>
                        <p className="text-muted-foreground">
                          {whereToFind.replace(/\*\*Where to find it:?\*\*/i, '').trim()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pro Tip */}
                {proTip && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-primary mb-1">Pro tip:</p>
                        <p className="text-muted-foreground">
                          {proTip.replace(/\*\*Pro tip:?\*\*/i, '').trim()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                {step.ctaButton && (
                  <Button
                    onClick={handleCTAClick}
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    {step.ctaButton.label}
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
