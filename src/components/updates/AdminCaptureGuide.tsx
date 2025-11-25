import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Film, Lightbulb, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AdminCaptureGuideProps {
  moduleTitle: string;
  moduleTrack: string;
  stepTitle: string;
  stepDescription: string;
  stepNumber: number;
  totalSteps: number;
  screenshotHint?: string;
  detailedInstructions?: string;
  targetPath: string;
  isGif?: boolean;
}

export const AdminCaptureGuide = ({
  moduleTitle,
  moduleTrack,
  stepTitle,
  stepDescription,
  stepNumber,
  totalSteps,
  screenshotHint,
  detailedInstructions,
  targetPath,
  isGif = false,
}: AdminCaptureGuideProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Smart suggestions based on step content
  const getSmartSuggestions = () => {
    const suggestions: string[] = [];
    const content = `${stepTitle} ${stepDescription} ${screenshotHint || ''} ${detailedInstructions || ''}`.toLowerCase();

    if (content.includes('navigation') || content.includes('menu')) {
      suggestions.push('Hover over menu items to show dropdowns');
    }
    if (content.includes('form') || content.includes('input')) {
      suggestions.push('Fill in sample data before capturing');
    }
    if (content.includes('modal') || content.includes('dialog')) {
      suggestions.push('Trigger the modal first, then capture');
    }
    if (content.includes('upload') || content.includes('camera')) {
      suggestions.push('Show the upload area clearly');
    }
    if (content.includes('button') || content.includes('click')) {
      suggestions.push('Position cursor near the button if possible');
    }
    
    // Add duration suggestion for GIFs
    if (isGif) {
      const isComplex = content.includes('multi-step') || content.includes('multiple') || content.includes('several');
      suggestions.push(isComplex ? 'Record for 8-10 seconds showing all steps' : 'Record for 3-5 seconds showing the key action');
    }

    // Suggest preview mode based on path
    const isPublicPath = targetPath === '/' || targetPath.includes('/login') || targetPath.includes('/signup') || targetPath.includes('/landing');
    if (isPublicPath) {
      suggestions.push('Use Guest mode (unauthenticated users see this)');
    } else {
      suggestions.push('Use Authenticated mode (requires logged-in user)');
    }

    return suggestions;
  };

  const suggestions = getSmartSuggestions();

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="mb-3 border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardContent className="p-3">
          {/* Compact header - always visible */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Location breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mb-1">
                <Badge variant="outline" className="font-normal text-xs px-1.5 py-0">
                  {moduleTrack}
                </Badge>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium truncate">{moduleTitle}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-primary">
                  Step {stepNumber}/{totalSteps}
                </span>
              </div>
              
              {/* Compact title + hint preview */}
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-foreground truncate">{stepTitle}</h4>
                {screenshotHint && !isExpanded && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {isGif ? '🎬 ' : '📸 '}
                    {screenshotHint.slice(0, 60)}{screenshotHint.length > 60 ? '...' : ''}
                  </p>
                )}
              </div>
            </div>
            
            {/* Expand/collapse button */}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Expanded details */}
          <CollapsibleContent className="mt-3 space-y-2">
            {/* Full description */}
            <p className="text-sm text-muted-foreground">{stepDescription}</p>

            {/* What to capture - full version */}
            {screenshotHint && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5">
                <div className="flex items-start gap-2">
                  {isGif ? (
                    <Film className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-xs text-foreground mb-1">
                      {isGif ? 'WHAT TO RECORD:' : 'WHAT TO CAPTURE:'}
                    </p>
                    <p className="text-xs text-foreground/90">{screenshotHint}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Smart suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Suggestions:</span>
                </div>
                <ul className="space-y-0.5 ml-5">
                  {suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
};
