
import React from 'react';
import { OCRResult, ReceiptLineItem } from '@/types/expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, ShoppingBag, CreditCard, MapPin, Calendar, Clock, Receipt, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface DetailedReceiptViewProps {
  receiptData: OCRResult;
  receiptImage?: string;
  onRetry?: () => void;
}

const DetailedReceiptView: React.FC<DetailedReceiptViewProps> = ({ 
  receiptData, 
  receiptImage,
  onRetry
}) => {
  const hasLineItems = receiptData.lineItems && receiptData.lineItems.length > 0;
  const isLowConfidence = receiptData.confidence && receiptData.confidence < 0.7;
  
  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return '-';
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return format(date, 'MMM d, yyyy');
  };
  
  const formatTime = (date: Date | undefined) => {
    if (!date) return '-';
    return format(date, 'h:mm a');
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-green-100 text-green-800';
    if (confidence > 0.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      {isLowConfidence && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <InfoIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Some details may not have been read correctly.
            {onRetry && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 text-yellow-800" 
                onClick={onRetry}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try scanning again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Receipt Image */}
        {receiptImage && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Receipt className="w-4 h-4 mr-2" />
                Receipt Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md">
                <img 
                  src={receiptImage} 
                  alt="Receipt" 
                  className="w-full object-contain max-h-[500px]" 
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Receipt Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Purchase Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Store:</dt>
                <dd className="font-medium">{receiptData.storeDetails?.name || receiptData.description || '-'}</dd>
              </div>
              
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Date:</dt>
                <dd className="font-medium flex items-center">
                  <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                  {formatDate(receiptData.date)}
                </dd>
              </div>
              
              {receiptData.transactionTime && (
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Time:</dt>
                  <dd className="font-medium flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                    {formatTime(receiptData.transactionTime.value)}
                  </dd>
                </div>
              )}
              
              {receiptData.subtotal && (
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Subtotal:</dt>
                  <dd className="font-medium">{formatCurrency(receiptData.subtotal.amount)}</dd>
                </div>
              )}
              
              {receiptData.tax && (
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Tax:</dt>
                  <dd className="font-medium">{formatCurrency(receiptData.tax.amount)}</dd>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Total:</dt>
                <dd className="font-medium text-lg">{formatCurrency(receiptData.amount)}</dd>
              </div>
              
              {receiptData.paymentMethod && (
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Paid with:</dt>
                  <dd className="font-medium flex items-center">
                    <CreditCard className="w-3 h-3 mr-1 text-muted-foreground" />
                    {receiptData.paymentMethod.type}
                    {receiptData.paymentMethod.lastDigits && ` (${receiptData.paymentMethod.lastDigits})`}
                  </dd>
                </div>
              )}
              
              {receiptData.storeDetails?.address && (
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Address:</dt>
                  <dd className="font-medium text-right flex items-start">
                    <MapPin className="w-3 h-3 mr-1 mt-1 text-muted-foreground" />
                    <span>{receiptData.storeDetails.address}</span>
                  </dd>
                </div>
              )}
              
              {receiptData.receiptNumber && (
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Receipt #:</dt>
                  <dd className="font-medium">{receiptData.receiptNumber.value}</dd>
                </div>
              )}
            </dl>
            
            {receiptData.confidence && (
              <div className="mt-4">
                <Badge variant="outline" className={getConfidenceColor(receiptData.confidence)}>
                  Detection confidence: {Math.round(receiptData.confidence * 100)}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Line Items */}
      {hasLineItems && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Items Purchased</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptData.lineItems.map((item: ReceiptLineItem, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity || 1}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {receiptData.lineItems.some(item => item.confidence < 0.6) && (
              <Alert className="mt-4 bg-yellow-50">
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Some items may not have been detected with high confidence. Please verify the details.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DetailedReceiptView;
