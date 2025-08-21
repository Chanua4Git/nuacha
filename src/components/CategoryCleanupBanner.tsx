import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CleanupResult {
  duplicates_removed: number;
  categories_updated: number;
  message: string;
}

export const CategoryCleanupBanner: React.FC = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null);

  const runCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const { data, error } = await supabase
        .rpc('cleanup_duplicate_categories_advanced');
      
      if (error) throw error;
      
      const result = data?.[0] as CleanupResult;
      setLastCleanupResult(result);
      
      if (result.duplicates_removed > 0) {
        toast.success('Categories cleaned up successfully', {
          description: result.message
        });
        // Trigger a page refresh to see the updated categories
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast.error('Failed to clean up categories', {
        description: 'Please try again or contact support if the issue persists.'
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          {lastCleanupResult?.duplicates_removed === 0 ? (
            <span className="text-amber-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              No duplicate categories found. Your categories are clean!
            </span>
          ) : (
            <span className="text-amber-800">
              {lastCleanupResult 
                ? `Last cleanup: ${lastCleanupResult.message}`
                : 'Some categories may have duplicates. Click to clean up and improve performance.'
              }
            </span>
          )}
        </div>
        <Button 
          onClick={runCleanup} 
          disabled={isCleaningUp}
          variant="outline"
          size="sm"
          className="ml-4"
        >
          {isCleaningUp ? (
            <>Cleaning...</>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Up Categories
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
};