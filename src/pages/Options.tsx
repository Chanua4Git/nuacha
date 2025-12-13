import { useExpense } from '@/context/ExpenseContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Tag, Calculator, RefreshCw, Settings, CheckCircle, ArrowUpRight, Tags, Zap, Trash2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CategoryManager from '@/components/accounting/CategoryManager';
import BudgetManager from '@/components/accounting/BudgetManager';
import FamiliesManager from '@/components/FamiliesManager';
import FamilyMembersManager from '@/components/FamilyMembersManager';
import AppBreadcrumbs from '@/components/AppBreadcrumbs';
import { CategoryCleanupBanner } from '@/components/CategoryCleanupBanner';
import { useComprehensiveCategoryCleanup } from '@/hooks/useComprehensiveCategoryCleanup';
import { useEnhancedCategorySync } from '@/hooks/useEnhancedCategorySync';
import { SubscriptionOrdersTable } from '@/components/admin/SubscriptionOrdersTable';
import { useAdminRole } from '@/hooks/useAdminRole';

const Options = () => {
  const { selectedFamily } = useExpense();
  const { runComprehensiveCleanup, isProcessing } = useComprehensiveCategoryCleanup();
  const { 
    validateCategories, 
    migrateCategories, 
    setupVendorRules, 
    bulkCategorize, 
    runFullCategoryOptimization,
    isProcessing: isEnhancedProcessing 
  } = useEnhancedCategorySync();
  const { isAdmin } = useAdminRole();

  // Combine processing states
  const isAnyProcessing = isProcessing || isEnhancedProcessing;

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
              disabled={isAnyProcessing}
              variant="outline"
              className="ml-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
              {isProcessing ? 'Cleaning...' : 'Clean Up Categories'}
            </Button>
          </div>
        </div>
        
        <CategoryCleanupBanner />

          <Tabs defaultValue="families">
            <TabsList className="mb-6">
              <TabsTrigger value="families">
                <Users className="h-4 w-4 mr-2" />
                Families
              </TabsTrigger>
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
            <TabsTrigger value="management">
              <Settings className="h-4 w-4 mr-2" />
              Category Management
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="subscriptions">
                <CreditCard className="h-4 w-4 mr-2" />
                Subscriptions
              </TabsTrigger>
            )}
            </TabsList>

            <TabsContent value="families" className="mt-0">
              <FamiliesManager />
            </TabsContent>

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

          <TabsContent value="management" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Category System Management
                </CardTitle>
                <CardDescription>
                  Advanced tools to optimize and maintain your category system for better expense tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comprehensive Operations */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Comprehensive Operations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={runComprehensiveCleanup}
                      disabled={isAnyProcessing}
                      variant="default"
                      className="w-full justify-start gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isAnyProcessing ? 'Processing...' : 'Clean Up All Categories'}
                    </Button>

                    <Button
                      onClick={runFullCategoryOptimization}
                      disabled={isAnyProcessing}
                      variant="secondary"
                      className="w-full justify-start gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Full Category Optimization
                    </Button>
                  </div>
                </div>

                {/* Individual Operations */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Individual Operations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button
                      onClick={validateCategories}
                      disabled={isAnyProcessing}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Validate Categories
                    </Button>

                    <Button
                      onClick={migrateCategories}
                      disabled={isAnyProcessing}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Migrate Categories
                    </Button>

                    <Button
                      onClick={setupVendorRules}
                      disabled={isAnyProcessing}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Setup Vendor Rules
                    </Button>

                    <Button
                      onClick={bulkCategorize}
                      disabled={isAnyProcessing}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Tags className="h-4 w-4" />
                      Bulk Categorize
                    </Button>
                  </div>
                </div>
                
                {/* Information Panel */}
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg border">
                  <h4 className="font-medium mb-3 text-foreground">Category System Operations:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium mb-2">Comprehensive Operations:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Clean Up All:</strong> Removes duplicates, fixes classifications, maps expenses to budget categories</li>
                        <li>• <strong>Full Optimization:</strong> Complete workflow including validation, migration, rules, and categorization</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Individual Operations:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Validate:</strong> Checks for missing essential categories</li>
                        <li>• <strong>Migrate:</strong> Updates category names to comprehensive structure</li>
                        <li>• <strong>Vendor Rules:</strong> Creates smart categorization for T&T vendors</li>
                        <li>• <strong>Bulk Categorize:</strong> Auto-categorizes uncategorized expenses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="subscriptions" className="mt-0">
              <SubscriptionOrdersTable />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Options;
