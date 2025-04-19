
import React from 'react';
import { CreditCard } from 'lucide-react';
import DataRow from './DataRow';
import { Separator } from '@/components/ui/separator';

interface PaymentInfoProps {
  subtotal?: { amount: string };
  tax?: { amount: string };
  total?: string;
  paymentMethod?: {
    type: string;
    lastDigits?: string;
  };
}

const PaymentInfo: React.FC<PaymentInfoProps> = ({ subtotal, tax, total, paymentMethod }) => {
  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

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
      
      <DataRow
        label="Total"
        value={formatCurrency(total)}
      />
      
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
