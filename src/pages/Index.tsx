
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FamilySelector from '@/components/FamilySelector';
import ExpenseForm from '@/components/expense-form/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import RemindersList from '@/components/RemindersList';
import { CategorySyncBanner } from '@/components/CategorySyncBanner';
import { PlusCircle, ListFilter, Tag, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useFamilies } from '@/hooks/useFamilies';
import { useExpense } from '@/context/ExpenseContext';
import { ensureEssentialFamilyCategories } from '@/utils/categorySync';
const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedFamily } = useExpense();
  const initialTab = searchParams.get('tab') || 'expenses';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [hasRunAutoSync, setHasRunAutoSync] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'expenses';
    setActiveTab(tab);
  }, [searchParams]);

  // Auto-sync essential categories once per session when family is selected
  useEffect(() => {
    const autoSyncEssentials = async () => {
      if (selectedFamily && !hasRunAutoSync) {
        try {
          await ensureEssentialFamilyCategories(selectedFamily.id);
          setHasRunAutoSync(true);
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    };
    
    autoSyncEssentials();
  }, [selectedFamily, hasRunAutoSync]);

  const handleTabChange = (value: string) => {
    if (value === 'budget') {
      navigate('/budget');
    } else {
      setActiveTab(value);
      setSearchParams({ tab: value });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Calm, mindful financial entries</h1>
          <p className="text-muted-foreground mt-1">
            A softer way to track spending across families
          </p>
        </div>
        
        <CategorySyncBanner />
        
        <div className="flex flex-col md:flex-row md:items-start gap-4 mb-8">
          <div className="flex-1">
            <FamilySelector />
          </div>
          <div>
            <Button 
              onClick={() => navigate('/options')} 
              variant="outline" 
              className="w-full md:w-auto"
            >
              <Tag className="h-4 w-4 mr-2" />
              Add Categories
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-6">
                <TabsTrigger value="expenses">
                  <ListFilter className="h-4 w-4 mr-2" />
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="add-expense">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Expense
                </TabsTrigger>
                <TabsTrigger value="budget">
                  <Calculator className="h-4 w-4 mr-2" />
                  Budget
                </TabsTrigger>
              </TabsList>
              <TabsContent value="expenses" className="mt-0">
                <ExpenseList />
              </TabsContent>
              <TabsContent value="add-expense" className="mt-0">
                <ExpenseForm />
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <div className="space-y-6">
              <RemindersList />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
