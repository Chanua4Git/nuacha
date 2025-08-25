
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useReceiptDetails } from '@/hooks/useReceiptDetails';
import { CheckCircle, Edit, Loader2, Store, Tag, Trash2, CreditCard, Calendar, Receipt, Info } from 'lucide-react';
import { ReceiptLineItem } from '@/types/receipt';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';
import { CategoryWithCamelCase } from '@/types/expense';

interface DetailedReceiptViewProps {
  expenseId: string;
}

const DetailedReceiptView: React.FC<DetailedReceiptViewProps> = ({ expenseId }) => {
  const { receiptDetail, lineItems, isLoading, saveLineItem, deleteLineItem } = useReceiptDetails(expenseId);
  const { categories } = useUnifiedCategories({ mode: 'unified' });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<ReceiptLineItem | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Gently loading receipt details...</p>
      </div>
    );
  }

  if (!receiptDetail && lineItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <h3 className="text-lg font-medium">No receipt details available</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This expense doesn't have any receipt details or line items.
        </p>
      </div>
    );
  }

  const handleEditItem = (item: ReceiptLineItem) => {
    setEditingItem(item.id || 'new');
    setEditItemData({ ...item });
  };

  const handleSaveItem = async () => {
    if (!editItemData) return;
    
    try {
      await saveLineItem(editItemData);
      setEditingItem(null);
      setEditItemData(null);
    } catch (error) {
      console.error('Error saving line item:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditItemData(null);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      await deleteLineItem(id);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    if (editItemData) {
      setEditItemData({
        ...editItemData,
        categoryId
      });
    }
  };

  const acceptSuggestedCategory = (item: ReceiptLineItem) => {
    if (!item.suggestedCategoryId) return;
    
    const updatedItem = {
      ...item,
      categoryId: item.suggestedCategoryId
    };
    
    saveLineItem(updatedItem);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Helper to find a category by ID
  const getCategoryById = (id: string): CategoryWithCamelCase | undefined => {
    return categories.find(c => c.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Receipt Header Info */}
      {receiptDetail && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Receipt className="mr-2 h-5 w-5" />
              Receipt Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {receiptDetail.vendorName && (
              <div className="flex items-center">
                <Store className="mr-2 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{receiptDetail.vendorName}</p>
                  {receiptDetail.vendorAddress && (
                    <p className="text-sm text-muted-foreground">{receiptDetail.vendorAddress}</p>
                  )}
                </div>
              </div>
            )}
            
            {receiptDetail.transactionTime && (
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <p>{format(new Date(receiptDetail.transactionTime), 'PPP p')}</p>
              </div>
            )}
            
            {receiptDetail.paymentMethod && (
              <div className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                <p>Paid with {receiptDetail.paymentMethod}</p>
              </div>
            )}
            
            {receiptDetail.receiptNumber && (
              <div className="flex items-center">
                <p className="text-sm text-muted-foreground">Receipt #{receiptDetail.receiptNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Line Items */}
      {lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Tag className="mr-2 h-5 w-5" />
              Items ({lineItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-24">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item) => (
                  <TableRow key={item.id} className={editingItem === item.id ? "bg-muted/50" : ""}>
                    {editingItem === item.id ? (
                      // Editing mode
                      <>
                        <TableCell>
                          <input 
                            type="text"
                            className="w-full border rounded p-1 text-sm"
                            value={editItemData?.description || ''}
                            onChange={(e) => setEditItemData({...editItemData!, description: e.target.value})}
                          />
                        </TableCell>
                        <TableCell>
                          <input 
                            type="number" 
                            className="w-20 border rounded p-1 text-sm"
                            value={editItemData?.quantity || ''}
                            onChange={(e) => setEditItemData({...editItemData!, quantity: parseFloat(e.target.value)})}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-24 border rounded p-1 text-sm text-right"
                            value={editItemData?.totalPrice || ''}
                            onChange={(e) => setEditItemData({...editItemData!, totalPrice: parseFloat(e.target.value)})}
                          />
                        </TableCell>
                        <TableCell>
                          <select 
                            className="w-full border rounded p-1 text-sm"
                            value={editItemData?.categoryId || ''}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                          >
                            <option value="">Select category</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={handleSaveItem}
                          >
                            Save
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      // View mode
                      <>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity || 1}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.totalPrice)}</TableCell>
                        <TableCell>
                          {item.categoryId ? (
                            <Badge 
                              style={{ 
                                backgroundColor: item.category?.color || '#888',
                                color: '#fff' 
                              }}
                            >
                              {item.category?.name || 'Unknown'}
                            </Badge>
                          ) : item.suggestedCategoryId ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="border-dashed">
                                {item.suggestedCategory?.name || 'Suggested'}
                              </Badge>
                              <Button 
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                title="Accept suggestion"
                                onClick={() => acceptSuggestedCategory(item)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="outline">Uncategorized</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button 
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => item.id && handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                
                {/* Summary row */}
                <TableRow>
                  <TableCell colSpan={2} className="font-medium">Total</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(lineItems.reduce((sum, item) => sum + item.totalPrice, 0))}
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditItem({ 
                  expenseId, 
                  description: '', 
                  totalPrice: 0
                })}
              >
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DetailedReceiptView;
