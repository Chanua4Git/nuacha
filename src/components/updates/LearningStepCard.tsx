import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, ExternalLink, Lightbulb } from 'lucide-react';
import { LearningStep } from '@/constants/learningCenterData';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getLearningVisualUrl } from '@/utils/learningVisuals';
import { cn } from '@/lib/utils';

interface LearningStepCardProps {
  step: LearningStep;
  stepNumber: number;
  moduleId: string;
  isCompleted: boolean;
  onToggleComplete: () => void;
}

export function LearningStepCard({
  step,
  stepNumber,
  moduleId,
  isCompleted,
  onToggleComplete
}: LearningStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasVisual, setHasVisual] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [visualUrl, setVisualUrl] = useState<string>('');
  const navigate = useNavigate();

  // Check for visuals on mount - prioritize GIF → screenshot → AI
  useState(() => {
    const checkAndSetVisual = async () => {
      // Check for GIF first (highest priority)
      const gifUrl = getLearningVisualUrl(moduleId, step.id, 'gif');
      const gifImg = new Image();
      gifImg.src = gifUrl;
      
      const gifExists = await new Promise((resolve) => {
        gifImg.onload = () => resolve(true);
        gifImg.onerror = () => resolve(false);
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
    
    checkAndSetVisual();
  });

  const handleCTAClick = () => {
    if (step.ctaButton?.path) {
      navigate(step.ctaButton.path);
    }
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
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Step Number */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
            {stepNumber}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
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
                  "w-full rounded-lg border border-border bg-muted/30 overflow-hidden",
                  !hasVisual && "hidden"
                )}>
                  <img 
                    src={visualUrl}
                    alt={step.visual?.alt || step.title}
                    className="w-full max-h-48 md:max-h-64 lg:max-h-80 object-contain mx-auto"
                    onLoad={() => { 
                      setHasVisual(true); 
                      setImageLoading(false); 
                    }}
                    onError={() => { 
                      setHasVisual(false); 
                      setImageLoading(false); 
                    }}
                  />
                </div>

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
