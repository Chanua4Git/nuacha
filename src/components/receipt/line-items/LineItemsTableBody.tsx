
import React from 'react';
import { TableBody, TableRow, TableCell } from '@/components/ui/table';
import { ReceiptLineItem } from '@/types/expense';

interface LineItemsTableBodyProps {
  lineItems: ReceiptLineItem[];
  formatCurrency: (amount: string | undefined) => string;
}

const LineItemsTableBody: React.FC<LineItemsTableBodyProps> = ({ lineItems, formatCurrency }) => {
  return (
    <TableBody>
      {lineItems.map((item: ReceiptLineItem, index: number) => (
        <TableRow key={index}>
          <TableCell>{item.description}</TableCell>
          <TableCell className="text-right">{item.quantity || 1}</TableCell>
          <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
};

export default LineItemsTableBody;
