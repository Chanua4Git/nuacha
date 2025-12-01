import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
  isVisible: boolean;
  title: string;
  description: string;
}

const ProcessingOverlay = ({ isVisible, title, description }: ProcessingOverlayProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-background rounded-2xl p-8 shadow-2xl max-w-md mx-4 flex flex-col items-center gap-6">
        <Loader2 className="h-16 w-16 animate-spin" style={{ color: '#5A7684' }} />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingOverlay;
