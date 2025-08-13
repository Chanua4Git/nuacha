import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';
import { useFamilies } from '@/hooks/useFamilies';
import { useCategorySync } from '@/hooks/useCategorySync';
import { useCategories } from '@/hooks/useCategories';

export const CategorySyncBanner = () => {
  const { selectedFamily } = useExpense();
  const { families } = useFamilies();
  const { categories } = useCategories(selectedFamily?.id);
  const { syncCategoriesForFamily, syncCategoriesForAllFamilies, isSyncing } = useCategorySync();
  const [dismissed, setDismissed] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check if categories need syncing (look for the new structure)
  const needsSync = hasChecked && categories.length > 0 && !categories.some(cat => 
    cat.name.includes('Education & Child Expenses') || 
    cat.name.includes('Housing & Utilities') ||
    cat.name.includes('Caregiving & Medical')
  );

  useEffect(() => {
    // Only check after categories have loaded
    if (categories.length >= 0) {
      setHasChecked(true);
    }
  }, [categories]);

  // Don't show if dismissed, no family selected, or sync not needed
  if (dismissed || !selectedFamily || !needsSync || categories.length === 0) {
    return null;
  }

  const handleSyncCurrentFamily = async () => {
    const success = await syncCategoriesForFamily(selectedFamily.id);
    if (success) {
      setDismissed(true);
    }
  };

  const handleSyncAllFamilies = async () => {
    const familyIds = families.map(f => f.id);
    const success = await syncCategoriesForAllFamilies(familyIds);
    if (success) {
      setDismissed(true);
    }
  };

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg">New Category Structure Available</CardTitle>
          <CardDescription>
            We've introduced a new 12-category structure to better organize your expenses.
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDismissed(true)}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          The new structure includes categories like "Education & Child Expenses", "Housing & Utilities", 
          and "Caregiving & Medical" to better match your tracking needs.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handleSyncCurrentFamily}
            disabled={isSyncing}
            size="sm"
          >
            {isSyncing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Sync "{selectedFamily.name}" Family
          </Button>
          {families.length > 1 && (
            <Button
              variant="outline"
              onClick={handleSyncAllFamilies}
              disabled={isSyncing}
              size="sm"
            >
              {isSyncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sync All {families.length} Families
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};