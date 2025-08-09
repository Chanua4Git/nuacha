
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LowConfidenceAlertProps {
  onRetry?: () => void;
}

const LowConfidenceAlert: React.FC<LowConfidenceAlertProps> = ({ onRetry }) => {
  return (
    <Alert className="bg-yellow-50 border-yellow-200">
      <InfoIcon className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        Some details may not have been read correctly.
        {onRetry && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 text-yellow-800" 
            onClick={onRetry}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Try scanning again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default LowConfidenceAlert;
