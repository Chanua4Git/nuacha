
import React, { useState } from 'react';
import { TableBody, TableRow, TableCell } from '@/components/ui/table';
import { ReceiptLineItem } from '@/types/receipt';
import CategorySelector from '@/components/CategorySelector';
import FamilyMemberSelector from '@/components/FamilyMemberSelector';
import { Button } from '@/components/ui/button';
import { Edit, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useContextAwareExpense } from '@/hooks/useContextAwareExpense';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

interface LineItemsTableBodyProps {
  lineItems: ReceiptLineItem[];
  formatCurrency: (amount: string | undefined) => string;
  onSaveLineItem?: (item: ReceiptLineItem) => Promise<void>;
  familyId?: string;
  expenseId?: string;
  vendorName?: string;
  allLineItems?: ReceiptLineItem[];
}

const LineItemsTableBody: React.FC<LineItemsTableBodyProps> = ({ 
  lineItems, 
  formatCurrency, 
  onSaveLineItem,
  familyId,
  expenseId,
  vendorName,
  allLineItems 
}) => {
  const [editingItems, setEditingItems] = useState<Record<string | number, ReceiptLineItem>>({});
  const { selectedFamily, isDemo } = useContextAwareExpense();
  const { members } = useFamilyMembers(selectedFamily?.id);
  
  const handleEdit = (index: number, item: ReceiptLineItem) => {
    setEditingItems(prev => ({
      ...prev,
      [index]: {...item}
    }));
  };
  
  const handleCancel = (index: number) => {
    setEditingItems(prev => {
      const updated = {...prev};
      delete updated[index];
      return updated;
    });
  };
  
  const handleChange = (index: number, field: keyof ReceiptLineItem, value: any) => {
    setEditingItems(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };
  
  const handleSave = async (index: number, item: ReceiptLineItem) => {
    try {
      const updatedItem = {
        ...item,
        ...editingItems[index],
        expenseId: expenseId || item.expenseId
      };
      
      if (onSaveLineItem) {
        await onSaveLineItem(updatedItem);
        handleCancel(index);
        toast.success("Item updated successfully");
      }
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleMemberChange = async (value: string, item: ReceiptLineItem, index?: number) => {
    try {
      if (index !== undefined && editingItems[index]) {
        // If the item is in edit mode, update the state
        handleChange(index, 'memberId', value);
        return;
      }
      
      // If not in edit mode, save immediately
      if (onSaveLineItem) {
        const updatedItem = {
          ...item,
          memberId: value,
          expenseId: expenseId || item.expenseId
        };
        
        await onSaveLineItem(updatedItem);
        toast.success("Family member assigned successfully");
      }
    } catch (error) {
      console.error("Failed to assign family member:", error);
      toast.error("Failed to assign family member");
    }
  };

  return (
    <TableBody>
      {lineItems.map((item: ReceiptLineItem, index: number) => {
        const isEditing = !!editingItems[index];
        const editingItem = editingItems[index] || item;
        
        return (
          <TableRow key={index} className={item.suggestedCategoryId && !item.categoryId ? "bg-muted/20" : ""}>
            <TableCell>
              {isEditing ? (
                <Input 
                  value={editingItem.description} 
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  className="w-full"
                />
              ) : (
                <div className="flex items-center">
                  <span>{item.description}</span>
                  {item.suggestedCategoryId && !item.categoryId && (
                    <span className="ml-2 text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">
                      Suggested
                    </span>
                  )}
                </div>
              )}
            </TableCell>
            <TableCell className="text-right">
              {isEditing ? (
                <Input 
                  type="number"
                  value={editingItem.quantity || 1} 
                  onChange={(e) => handleChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                  className="w-16 ml-auto"
                  min={0.01}
                  step={0.01}
                />
              ) : (
                item.quantity || 1
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {isEditing ? (
                <Input 
                  type="number"
                  value={editingItem.totalPrice || 0} 
                  onChange={(e) => handleChange(index, 'totalPrice', parseFloat(e.target.value) || 0)}
                  className="w-24 ml-auto"
                  min={0}
                  step={0.01}
                />
              ) : (
                formatCurrency(item.totalPrice?.toString())
              )}
            </TableCell>
            <TableCell>
              {familyId && (
                <CategorySelector 
                  value={isEditing ? editingItem.categoryId : item.categoryId} 
                  onChange={(categoryId) => {
                    if (isEditing) {
                      handleChange(index, 'categoryId', categoryId);
                    } else if (onSaveLineItem) {
                      const updatedItem = {
                        ...item,
                        categoryId,
                        expenseId: expenseId || item.expenseId
                      };
                      onSaveLineItem(updatedItem)
                        .then(() => toast.success("Category updated"))
                        .catch(() => toast.error("Failed to update category"));
                    }
                  }}
                  suggestedCategoryId={item.suggestedCategoryId}
                  place={vendorName}
                  lineItems={allLineItems}
                  className="mb-0"
                />
              )}
            </TableCell>
            <TableCell>
              {isDemo ? (
                <div className="text-xs text-muted-foreground italic">
                  No Family Members<br />
                  <span className="text-xs">When you're ready, you can add family members to track expenses for specific individuals.</span>
                </div>
              ) : familyId ? (
                <FamilyMemberSelector
                  value={isEditing ? editingItem.memberId : item.memberId}
                  onChange={(value) => handleMemberChange(value, item, isEditing ? index : undefined)}
                  className="mb-0"
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  {item.memberId || 'Unassigned'}
                </div>
              )}
            </TableCell>
            <TableCell className="text-right">
              {onSaveLineItem && (
                isEditing ? (
                  <div className="flex justify-end space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleCancel(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleSave(index, item)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(index, item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  );
};

export default LineItemsTableBody;
