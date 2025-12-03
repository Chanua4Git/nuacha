import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, ExternalLink, Lightbulb, Link, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { LearningStep } from '@/constants/learningCenterData';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getLearningVisualUrl, getNarratorVideoUrl, checkNarratorExists, getAllClipsForStep } from '@/utils/learningVisuals';
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
  const [hasNarrator, setHasNarrator] = useState(false);
  const [narratorUrl, setNarratorUrl] = useState<string>('');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Multi-clip support
  const [clips, setClips] = useState<string[]>([]);
  const [activeClip, setActiveClip] = useState(0);
  const [staticVisualUrl, setStaticVisualUrl] = useState<string>('');

  // Load clips and visuals on mount
  useEffect(() => {
    const loadContent = async () => {
      setImageLoading(true);
      console.log(`[LearningStepCard] Loading content for ${moduleId}/${step.id}`);
      
      // Check for GIF clips first (highest priority)
      const gifClips = await getAllClipsForStep(moduleId, step.id);
      console.log(`[LearningStepCard] GIF clips found:`, gifClips);
      
      if (gifClips.length > 0) {
        setClips(gifClips);
        setHasVisual(true);
        setImageLoading(false);
        return;
      }
      
      // Check for screenshot second
      const screenshotUrl = getLearningVisualUrl(moduleId, step.id, 'screenshot');
      try {
        const screenshotRes = await fetch(screenshotUrl, { method: 'HEAD' });
        if (screenshotRes.ok) {
          console.log(`[LearningStepCard] Screenshot found:`, screenshotUrl);
          setStaticVisualUrl(screenshotUrl);
          setHasVisual(true);
          setImageLoading(false);
          return;
        }
      } catch {}
      
      // Check for AI-generated third
      const aiUrl = getLearningVisualUrl(moduleId, step.id, 'ai-generated');
      try {
        const aiRes = await fetch(aiUrl, { method: 'HEAD' });
        if (aiRes.ok) {
          console.log(`[LearningStepCard] AI visual found:`, aiUrl);
          setStaticVisualUrl(aiUrl);
          setHasVisual(true);
          setImageLoading(false);
          return;
        }
      } catch {}
      
      // Use custom visual URL if provided
      if (step.visual?.url) {
        setStaticVisualUrl(step.visual.url);
        setHasVisual(true);
      }
      
      console.log(`[LearningStepCard] No visuals found for ${moduleId}/${step.id}`);
      setImageLoading(false);
    };
    
    const checkNarrator = async () => {
      const extension = await checkNarratorExists(moduleId, step.id);
      console.log(`[LearningStepCard] Narrator check for ${moduleId}/${step.id}:`, extension);
      if (extension) {
        setHasNarrator(true);
        setNarratorUrl(getNarratorVideoUrl(moduleId, step.id, extension));
      }
    };
    
    loadContent();
    checkNarrator();
  }, [moduleId, step.id, step.visual?.url]);

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

  const handlePrevClip = () => {
    setActiveClip(prev => Math.max(0, prev - 1));
  };

  const handleNextClip = () => {
    setActiveClip(prev => Math.min(clips.length - 1, prev + 1));
  };

  // Extract "Where to find it" and "Pro tip" from markdown
  const sections = step.detailedInstructions.split('\n\n');
  const mainContent = sections.filter(s => 
    !s.toLowerCase().includes('where to find it') && 
    !s.toLowerCase().includes('pro tip')
  ).join('\n\n');
  
  const whereToFind = sections.find(s => s.toLowerCase().includes('where to find it'));
  const proTip = sections.find(s => s.toLowerCase().includes('pro tip'));

  // Determine if current visual is a video
  const currentVisualUrl = clips.length > 0 ? clips[activeClip] : staticVisualUrl;
  const isVideo = currentVisualUrl?.endsWith('.webm') || currentVisualUrl?.endsWith('.mp4') || currentVisualUrl?.includes('/gif/');

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
                
                {hasVisual && !imageLoading && (
                  <div className={cn(
                    "relative w-full rounded-lg sm:rounded-lg border border-border bg-muted/30 overflow-hidden",
                    "mx-[-8px] sm:mx-0 w-[calc(100%+16px)] sm:w-full"
                  )}>
                    {isVideo ? (
                      <video 
                        key={currentVisualUrl}
                        src={currentVisualUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full max-h-72 md:max-h-80 lg:max-h-96 object-contain mx-auto"
                        onLoadedData={() => setHasVisual(true)}
                        onError={() => setHasVisual(false)}
                      />
                    ) : (
                      <img 
                        src={currentVisualUrl}
                        alt={step.visual?.alt || step.title}
                        className="w-full max-h-72 md:max-h-80 lg:max-h-96 object-contain mx-auto"
                        onLoad={() => setHasVisual(true)}
                        onError={() => setHasVisual(false)}
                      />
                    )}
                    
                    {/* Multi-clip navigation */}
                    {clips.length > 1 && (
                      <>
                        {/* Prev/Next buttons */}
                        <div className="absolute inset-y-0 left-2 flex items-center">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={handlePrevClip}
                            disabled={activeClip === 0}
                            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="absolute inset-y-0 right-2 flex items-center">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleNextClip}
                            disabled={activeClip === clips.length - 1}
                            className="h-8 w-8 rounded-full bg-background/80 hover:bg-background shadow"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Clip indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 px-3 py-1 rounded-full">
                          <span className="text-xs font-medium">
                            {activeClip + 1} / {clips.length}
                          </span>
                        </div>
                      </>
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
                  </div>
                )}

                {/* Desktop Narrator - Independent of visual content */}
                {!isMobile && hasNarrator && narratorUrl && (
                  <div className="flex justify-end mt-2">
                    <NarratorOverlay
                      videoUrl={narratorUrl}
                      displayMode={step.narrator?.displayMode || 'face-voice'}
                    />
                  </div>
                )}

                {/* Clip dots for quick navigation */}
                {clips.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {clips.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveClip(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          i === activeClip ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                        aria-label={`Go to clip ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

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
                    {isVideo ? (
                      <video 
                        src={currentVisualUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img 
                        src={currentVisualUrl}
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