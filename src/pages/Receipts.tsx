import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Receipt, Filter, Download, FileImage, ChevronDown, FileText, Archive, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ReceiptGallery from '@/components/receipt/ReceiptGallery';
import ExportProgressDialog from '@/components/receipt/ExportProgressDialog';
import BatchBackgroundRemoval from '@/components/receipt/BatchBackgroundRemoval';
import { useFamilies } from '@/hooks/useFamilies';
import { useCategories } from '@/hooks/useCategories';
import { useExpenses } from '@/hooks/useExpenses';
import { useState } from 'react';
import { useFilters } from '@/hooks/useFilters';
import { exportReceiptsToPDF, exportReceiptsToZip, exportReceiptImages, estimateExportSize, ProgressCallback } from '@/utils/receipt/exportUtils';
import { toast } from 'sonner';

const Receipts = () => {
  const { families } = useFamilies();
  const { categories } = useCategories();
  const { filters, updateFilter, clearFilters } = useFilters();
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [showBatchRemoval, setShowBatchRemoval] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Export states
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [isExportComplete, setIsExportComplete] = useState(false);
  const [isExportError, setIsExportError] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState('');

  // Get filtered expenses for export
  const expenseFilters = {
    familyId: filters.familyId,
    categoryId: filters.categoryIds?.[0],
    startDate: filters.startDate,
    endDate: filters.endDate,
    place: filters.searchTerm,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    searchTerm: filters.searchTerm
  };
  
  const { expenses } = useExpenses(expenseFilters);
  
  // Filter to selected receipts and those with images
  const getExportableExpenses = (useSelected = true) => {
    let expensesToExport = expenses.filter(expense => 
      expense.receiptUrl || expense.receiptImageUrl
    );
    
    if (useSelected && selectedReceipts.length > 0) {
      expensesToExport = expensesToExport.filter(expense => 
        selectedReceipts.includes(expense.id)
      );
    }
    
    return expensesToExport;
  };

  const resetExportState = () => {
    setExportProgress(null);
    setIsExportComplete(false);
    setIsExportError(false);
    setExportErrorMessage('');
  };

  const handleExportType = async (type: 'pdf' | 'zip' | 'images') => {
    const expensesToExport = getExportableExpenses();
    
    if (expensesToExport.length === 0) {
      toast.error('No receipts with images found to export');
      return;
    }

    setIsExportDialogOpen(true);
    resetExportState();

    const progressCallback: ProgressCallback = (progress) => {
      setExportProgress(progress);
    };

    try {
      switch (type) {
        case 'pdf':
          await exportReceiptsToPDF(expensesToExport, families, categories, progressCallback);
          break;
        case 'zip':
          await exportReceiptsToZip(expensesToExport, families, categories, progressCallback);
          break;
        case 'images':
          await exportReceiptImages(expensesToExport, progressCallback);
          break;
      }
      
      setIsExportComplete(true);
      toast.success(`Successfully exported ${expensesToExport.length} receipts`);
      
    } catch (error) {
      console.error('Export failed:', error);
      setIsExportError(true);
      setExportErrorMessage(error instanceof Error ? error.message : 'Export failed');
      toast.error('Export failed. Please try again.');
    }
  };

  const handleExportAll = async (type: 'pdf' | 'zip' | 'images') => {
    const expensesToExport = getExportableExpenses(false); // Don't filter by selection
    
    if (expensesToExport.length === 0) {
      toast.error('No receipts with images found to export');
      return;
    }

    setIsExportDialogOpen(true);
    resetExportState();

    const progressCallback: ProgressCallback = (progress) => {
      setExportProgress(progress);
    };

    try {
      switch (type) {
        case 'pdf':
          await exportReceiptsToPDF(expensesToExport, families, categories, progressCallback);
          break;
        case 'zip':
          await exportReceiptsToZip(expensesToExport, families, categories, progressCallback);
          break;
        case 'images':
          await exportReceiptImages(expensesToExport, progressCallback);
          break;
      }
      
      setIsExportComplete(true);
      toast.success(`Successfully exported ${expensesToExport.length} receipts`);
      
    } catch (error) {
      console.error('Export failed:', error);
      setIsExportError(true);
      setExportErrorMessage(error instanceof Error ? error.message : 'Export failed');
      toast.error('Export failed. Please try again.');
    }
  };

  const filterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;
  
  // Get size estimates for UI
  const expensesForEstimate = getExportableExpenses();
  const sizeEstimates = expensesForEstimate.length > 0 ? estimateExportSize(expensesForEstimate) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <FileImage className="h-8 w-8 text-primary" />
                Receipt Management
              </h1>
              <p className="text-muted-foreground mt-2">
                Organize and manage your receipt collection by family, category, and more
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Batch Background Removal Button */}
              <Dialog open={showBatchRemoval} onOpenChange={setShowBatchRemoval}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Remove Backgrounds
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <BatchBackgroundRemoval 
                    onClose={() => setShowBatchRemoval(false)}
                    filters={expenseFilters}
                    onComplete={() => {
                      setRefreshKey(prev => prev + 1);
                      setShowBatchRemoval(false);
                    }}
                  />
                </DialogContent>
              </Dialog>

              {selectedReceipts.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Selected ({selectedReceipts.length})
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onClick={() => handleExportType('pdf')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">Download as PDF</div>
                        <div className="text-xs text-muted-foreground">
                          Single document {sizeEstimates && `(~${sizeEstimates.pdf})`}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportType('zip')}>
                      <Archive className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">Download as ZIP</div>
                        <div className="text-xs text-muted-foreground">
                          Images + CSV data {sizeEstimates && `(~${sizeEstimates.zip})`}
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportType('images')}>
                      <Image className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">Images Only</div>
                        <div className="text-xs text-muted-foreground">
                          Receipt images {sizeEstimates && `(~${sizeEstimates.images})`}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Export All Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export All
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem onClick={() => handleExportAll('pdf')}>
                    <FileText className="mr-2 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">Download as PDF</div>
                      <div className="text-xs text-muted-foreground">All filtered receipts</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportAll('zip')}>
                    <Archive className="mr-2 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">Download as ZIP</div>
                      <div className="text-xs text-muted-foreground">Images + CSV data</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportAll('images')}>
                    <Image className="mr-2 h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">Images Only</div>
                      <div className="text-xs text-muted-foreground">Receipt images</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {filterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filterCount} active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Family</label>
                <Select 
                  value={filters.familyId} 
                  onValueChange={(value) => updateFilter('familyId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All families" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All families</SelectItem>
                    {families.map((family) => (
                      <SelectItem key={family.id} value={family.id}>
                        {family.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={filters.categoryIds?.[0]} 
                  onValueChange={(value) => updateFilter('categoryIds', value === 'all' ? undefined : [value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input 
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input 
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search Vendor/Items</label>
                <Input 
                  placeholder="Search receipts..."
                  value={filters.searchTerm || ''}
                  onChange={(e) => updateFilter('searchTerm', e.target.value || undefined)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Min Amount</label>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={filters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Amount</label>
                <Input 
                  type="number"
                  placeholder="1000.00"
                  value={filters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  disabled={filterCount === 0}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Gallery */}
        <ReceiptGallery 
          key={refreshKey}
          filters={filters}
          selectedReceipts={selectedReceipts}
          onSelectionChange={setSelectedReceipts}
        />
        
        {/* Export Progress Dialog */}
        <ExportProgressDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          progress={exportProgress}
          isComplete={isExportComplete}
          isError={isExportError}
          errorMessage={exportErrorMessage}
        />
      </div>
    </div>
  );
};

export default Receipts;