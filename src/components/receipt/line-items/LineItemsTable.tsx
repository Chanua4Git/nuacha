
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ReceiptLineItem } from '@/types/receipt';
import LineItemsTableBody from './LineItemsTableBody';

interface LineItemsTableProps {
  lineItems: ReceiptLineItem[];
  formatCurrency: (amount: string | undefined) => string;
  onSaveLineItem?: (item: ReceiptLineItem) => Promise<void>;
  familyId?: string;
  expenseId?: string;
}

const LineItemsTable: React.FC<LineItemsTableProps> = ({
  lineItems,
  formatCurrency,
  onSaveLineItem,
  familyId,
  expenseId
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <LineItemsTableBody 
        lineItems={lineItems} 
        formatCurrency={formatCurrency} 
        onSaveLineItem={onSaveLineItem}
        familyId={familyId}
        expenseId={expenseId}
      />
    </Table>
  );
};

export default LineItemsTable;
