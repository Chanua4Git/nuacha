import React, { useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useFamilies } from '@/hooks/useFamilies';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { removeBackground, loadImage } from '@/utils/receipt/backgroundRemoval';
import { supabase } from '@/integrations/supabase/client';

interface BatchBackgroundRemovalProps {
  onClose: () => void;
  filters?: any;
  onComplete?: () => void;
}

const BatchBackgroundRemoval: React.FC<BatchBackgroundRemovalProps> = ({ onClose, filters, onComplete }) => {
  const { expenses } = useExpenses(filters);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentReceipt, setCurrentReceipt] = useState<string>('');

  // Find receipts with backgrounds that can be processed
  const receiptsWithImages = expenses?.filter(expense => {
    const hasReceiptUrl = expense.receiptUrl && !expense.receiptUrl.includes('processed-receipt');
    const hasReceiptImageUrl = expense.receiptImageUrl && !expense.receiptImageUrl.includes('processed-receipt');
    return hasReceiptUrl || hasReceiptImageUrl;
  }) || [];

  const handleBatchProcess = async () => {
    if (receiptsWithImages.length === 0) {
      toast.info('No receipts found that need processing');
      return;
    }

    setIsProcessing(true);
    setTotalCount(receiptsWithImages.length);
    setProcessedCount(0);
    setFailedCount(0);

    for (const expense of receiptsWithImages) {
      try {
        setCurrentReceipt(expense.description || 'Unknown receipt');

        // Determine which image URL to process
        const imageUrl = expense.receiptUrl || expense.receiptImageUrl;
        if (!imageUrl) continue;

        // Download the original image
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Load image and remove background
        const img = await loadImage(blob);
        const processedBlob = await removeBackground(img);

        // Upload processed image back to storage
        const fileName = `processed-receipt-${expense.id}-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, processedBlob, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(fileName);

        // Update expense with new processed receipt URLs
        const updateData: any = {};
        if (expense.receiptUrl) {
          updateData.receipt_url = urlData.publicUrl;
        }
        if (expense.receiptImageUrl) {
          updateData.receipt_image_url = urlData.publicUrl;
        }

        const { error: updateError } = await supabase
          .from('expenses')
          .update(updateData)
          .eq('id', expense.id);

        if (updateError) throw updateError;

        setProcessedCount(prev => prev + 1);
        
      } catch (error) {
        console.error(`Failed to process receipt for expense ${expense.id}:`, error);
        setFailedCount(prev => prev + 1);
      }
    }

    setIsProcessing(false);
    setCurrentReceipt('');
    
    if (failedCount === 0) {
      toast.success(`Successfully processed ${processedCount} receipts!`);
    } else {
      toast.warning(`Processed ${processedCount} receipts, ${failedCount} failed`);
    }

    // Call completion callback to refresh the data
    if (onComplete) {
      onComplete();
    }
  };

  const progress = totalCount > 0 ? ((processedCount + failedCount) / totalCount) * 100 : 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Batch Background Removal
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Remove backgrounds from existing receipt images to clean up your saved files.
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {receiptsWithImages.length} receipts ready for processing
          </Badge>
        </div>

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing: {currentReceipt}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-xs text-muted-foreground">
              {processedCount + failedCount} of {totalCount} processed
              {failedCount > 0 && ` (${failedCount} failed)`}
            </div>
          </div>
        )}

        {!isProcessing && (processedCount > 0 || failedCount > 0) && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>
              Completed: {processedCount} successful, {failedCount} failed
            </span>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Close
          </Button>
          <Button 
            onClick={handleBatchProcess} 
            disabled={isProcessing || receiptsWithImages.length === 0}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Process All Receipts
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchBackgroundRemoval;