import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Receipt, Filter, Download, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ReceiptGallery from '@/components/receipt/ReceiptGallery';
import { useFamilies } from '@/hooks/useFamilies';
import { useCategories } from '@/hooks/useCategories';
import { useState } from 'react';
import { useFilters } from '@/hooks/useFilters';

const Receipts = () => {
  const { families } = useFamilies();
  const { categories } = useCategories();
  const { filters, updateFilter, clearFilters } = useFilters();
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);

  const handleExportSelected = () => {
    // TODO: Implement export functionality in Phase 3
    console.log('Exporting receipts:', selectedReceipts);
  };

  const filterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

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
              {selectedReceipts.length > 0 && (
                <Button onClick={handleExportSelected} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export Selected ({selectedReceipts.length})
                </Button>
              )}
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
          filters={filters}
          selectedReceipts={selectedReceipts}
          onSelectionChange={setSelectedReceipts}
        />
      </div>
    </div>
  );
};

export default Receipts;