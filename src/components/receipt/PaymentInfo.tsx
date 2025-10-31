
import React from 'react';
import { CreditCard, AlertCircle } from 'lucide-react';
import DataRow from './DataRow';
import { Separator } from '@/components/ui/separator';
import { calculateLineItemsSubtotal } from '@/utils/receipt/mergeReceipts';
import { OCRResult } from '@/types/expense';

interface PaymentInfoProps {
  subtotal?: { amount: string };
  tax?: { amount: string };
  total?: string;
  paymentMethod?: {
    type: string;
    lastDigits?: string;
  };
  lineItems?: OCRResult['lineItems'];
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({ subtotal, tax, total, paymentMethod, lineItems }) => {
  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Check if total is missing or zero
  const isMissingTotal = !total || parseFloat(total) === 0;
  const calculatedSubtotal = lineItems ? calculateLineItemsSubtotal(lineItems) : 0;

  return (
    <>
      {subtotal && (
        <DataRow
          label="Subtotal"
          value={formatCurrency(subtotal.amount)}
        />
      )}
      
      {tax && (
        <DataRow
          label="Tax"
          value={formatCurrency(tax.amount)}
        />
      )}
      
      <Separator />
      
      {isMissingTotal && calculatedSubtotal > 0 ? (
        <>
          <DataRow
            label="Running Subtotal"
            value={`$${calculatedSubtotal.toFixed(2)}`}
          />
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Scan bottom of receipt to capture final total
          </div>
        </>
      ) : (
        <DataRow
          label="Total"
          value={isMissingTotal ? 'Not captured yet' : formatCurrency(total)}
        />
      )}
      
      {paymentMethod && (
        <DataRow
          label="Paid with"
          value={`${paymentMethod.type}${paymentMethod.lastDigits ? ` (${paymentMethod.lastDigits})` : ''}`}
          icon={CreditCard}
        />
      )}
    </>
  );
};

export default PaymentInfo;
