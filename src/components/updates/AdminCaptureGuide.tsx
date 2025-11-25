import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Film, Lightbulb, ChevronRight } from 'lucide-react';

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
    <Card className="mb-4 border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardContent className="p-4 space-y-3">
        {/* Location breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Badge variant="outline" className="font-normal">
            {moduleTrack}
          </Badge>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium">{moduleTitle}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-primary">
            Step {stepNumber} of {totalSteps}
          </span>
        </div>

        {/* Step title and description */}
        <div>
          <h4 className="font-semibold text-foreground mb-1">{stepTitle}</h4>
          <p className="text-sm text-muted-foreground">{stepDescription}</p>
        </div>

        {/* What to capture */}
        {screenshotHint && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              {isGif ? (
                <Film className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              ) : (
                <Camera className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm text-foreground mb-1">
                  {isGif ? 'WHAT TO RECORD:' : 'WHAT TO CAPTURE:'}
                </p>
                <p className="text-sm text-foreground/90">{screenshotHint}</p>
              </div>
            </div>
          </div>
        )}

        {/* Smart suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span>Suggestions:</span>
            </div>
            <ul className="space-y-1 ml-6">
              {suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
