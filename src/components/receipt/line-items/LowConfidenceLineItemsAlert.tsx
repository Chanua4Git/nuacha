
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { ReceiptLineItem } from '@/types/expense';

interface LowConfidenceLineItemsAlertProps {
  lineItems: ReceiptLineItem[] | undefined;
}

const LowConfidenceLineItemsAlert: React.FC<LowConfidenceLineItemsAlertProps> = ({ lineItems }) => {
  // A confidence of 0/missing means "not measured" (our AI reader doesn't score items), not "low"
  if (!lineItems || !lineItems.some(item => typeof item.confidence === 'number' && item.confidence > 0 && item.confidence < 0.6)) return null;

  return (
    <Alert className="mt-4 bg-yellow-50">
      <InfoIcon className="h-4 w-4" />
      <AlertDescription>
        Some items may not have been detected with high confidence. Please verify the details.
      </AlertDescription>
    </Alert>
  );
};

export default LowConfidenceLineItemsAlert;
