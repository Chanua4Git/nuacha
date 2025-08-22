import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, CheckCircle, Wrench } from 'lucide-react';
import { useCategoryCleanup } from '@/hooks/useCategoryCleanup';

export const CategoryCleanupBanner: React.FC = () => {
  const { 
    runComprehensiveCleanup, 
    validateCategories, 
    isProcessing 
  } = useCategoryCleanup();

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <span className="font-medium text-yellow-800">
            Category Optimization Tools
          </span>
          <p className="text-sm text-yellow-700 mt-1">
            Clean up duplicate categories, fix orphaned references, and optimize your category structure for better performance.
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            onClick={validateCategories}
            disabled={isProcessing}
            variant="outline"
            size="sm"
            className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Validate
          </Button>
          <Button
            onClick={runComprehensiveCleanup}
            disabled={isProcessing}
            variant="outline"
            size="sm"
            className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-1" />
                Full Cleanup
              </>
            )}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};