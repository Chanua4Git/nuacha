
import { useExpense } from '@/context/ExpenseContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Users, Tag, Calculator, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CategoryManager from '@/components/accounting/CategoryManager';
import BudgetManager from '@/components/accounting/BudgetManager';
import FamilyMembersManager from '@/components/FamilyMembersManager';
import AppBreadcrumbs from '@/components/AppBreadcrumbs';
import { CategoryCleanupBanner } from '@/components/CategoryCleanupBanner';
import { useComprehensiveCategoryCleanup } from '@/hooks/useComprehensiveCategoryCleanup';

const Options = () => {
  const { selectedFamily } = useExpense();
  const { runComprehensiveCleanup, isProcessing } = useComprehensiveCategoryCleanup();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <AppBreadcrumbs currentPage="Configuration Options" />
        
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Configuration Options</h1>
              <p className="text-muted-foreground mt-1">
                Adjust your settings and manage your financial organization
              </p>
            </div>
            <Button 
              onClick={runComprehensiveCleanup}
              disabled={isProcessing}
              variant="outline"
              className="ml-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Cleaning...' : 'Clean Up Categories'}
            </Button>
          </div>
        </div>
        
        <CategoryCleanupBanner />

        <Tabs defaultValue="members">
          <TabsList className="mb-6">
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Family Members
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tag className="h-4 w-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="budgets">
              <Calculator className="h-4 w-4 mr-2" />
              Budgets
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="members" className="mt-0">
            <FamilyMembersManager />
          </TabsContent>
          
          <TabsContent value="categories" className="mt-0">
            {selectedFamily ? (
              <CategoryManager familyId={selectedFamily.id} />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <p>Please select a family first to manage categories.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="budgets" className="mt-0">
            {selectedFamily ? (
              <BudgetManager familyId={selectedFamily.id} />
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <p>Please select a family first to manage budgets.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Options;
