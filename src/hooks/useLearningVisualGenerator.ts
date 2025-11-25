import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LearningStep } from '@/constants/learningCenterData';

interface GenerateVisualParams {
  moduleId: string;
  stepId: string;
  title: string;
  description: string;
  screenshotHint?: string;
}

interface BatchGenerateParams {
  moduleId: string;
  stepId: string;
  step: LearningStep;
}

export const useLearningVisualGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVisual = async ({
    moduleId,
    stepId,
    title,
    description,
    screenshotHint
  }: GenerateVisualParams): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-learning-visual', {
        body: {
          moduleId,
          stepId,
          title,
          description,
          screenshotHint
        }
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (!data?.success || !data?.imageUrl) {
        throw new Error(data?.error || 'Failed to generate visual');
      }

      toast.success(`Visual generated for "${title}"`);
      return data.imageUrl;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate visual';
      setError(errorMessage);
      
      if (errorMessage.includes('Rate limit')) {
        toast.error('Too many requests. Please wait a moment and try again.');
      } else if (errorMessage.includes('Payment required')) {
        toast.error('Please add credits to your Lovable workspace.');
      } else {
        toast.error(`Failed to generate visual: ${errorMessage}`);
      }
      
      console.error('Error generating visual:', err);
      return null;

    } finally {
      setIsGenerating(false);
    }
  };

  const generateBatchVisuals = async (
    steps: BatchGenerateParams[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, string>> => {
    setIsGenerating(true);
    setError(null);

    const results = new Map<string, string>();
    const batchSize = 3; // Process 3 at a time to avoid rate limits
    
    try {
      for (let i = 0; i < steps.length; i += batchSize) {
        const batch = steps.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async ({ moduleId, stepId, step }) => {
          const imageUrl = await generateVisual({
            moduleId,
            stepId,
            title: step.title,
            description: step.description,
            screenshotHint: step.screenshotHint
          });

          if (imageUrl) {
            results.set(`${moduleId}-${stepId}`, imageUrl);
          }

          return imageUrl;
        });

        await Promise.all(batchPromises);
        
        if (onProgress) {
          onProgress(Math.min(i + batchSize, steps.length), steps.length);
        }

        // Add delay between batches to respect rate limits
        if (i + batchSize < steps.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      toast.success(`Generated ${results.size} visuals successfully`);
      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch generation failed';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error in batch generation:', err);
      return results;

    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateVisual,
    generateBatchVisuals,
    isGenerating,
    error
  };
};
