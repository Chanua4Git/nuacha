
import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ReceiptLineItem } from '@/types/expense';
import LineItemsTableBody from './LineItemsTableBody';

interface LineItemsTableProps {
  lineItems: ReceiptLineItem[];
  formatCurrency: (amount: string | undefined) => string;
}

const LineItemsTable: React.FC<LineItemsTableProps> = ({ lineItems, formatCurrency }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <LineItemsTableBody lineItems={lineItems} formatCurrency={formatCurrency} />
    </Table>
  );
};

export default LineItemsTable;
