
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import FamilySelector from '@/components/FamilySelector';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import RemindersList from '@/components/RemindersList';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { PlusCircle, ListFilter, BellRing } from 'lucide-react';

const Index = () => {
  return (
    <ExpenseProvider>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Household Expense Tracker</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage expenses across multiple families
            </p>
          </div>
          
          <FamilySelector />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="expenses">
                <TabsList className="mb-6">
                  <TabsTrigger value="expenses">
                    <ListFilter className="h-4 w-4 mr-2" />
                    Expenses
                  </TabsTrigger>
                  <TabsTrigger value="add-expense">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Expense
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
    </ExpenseProvider>
  );
};

export default Index;
