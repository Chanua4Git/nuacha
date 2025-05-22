
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FamilySelector from '@/components/FamilySelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpense } from '@/context/ExpenseContext';
import { Button } from '@/components/ui/button';
import { Calendar, FileBarChart, Filter, Download, ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import CategorySelector from '@/components/CategorySelector';
import AppBreadcrumbs from '@/components/AppBreadcrumbs';
import { useReportTemplates } from '@/hooks/useReportTemplates';

const Reports = () => {
  const { selectedFamily, expenses, categories } = useExpense();
  const { templates, isLoading: templatesLoading } = useReportTemplates();
  const [reportType, setReportType] = useState<string>('expenses');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [templateId, setTemplateId] = useState<string | undefined>();
  
  const filterExpenses = () => {
    if (!selectedFamily) return [];
    
    let filtered = expenses.filter(expense => expense.familyId === selectedFamily.id);
    
    if (startDate) {
      filtered = filtered.filter(expense => new Date(expense.date) >= startDate);
    }
    
    if (endDate) {
      filtered = filtered.filter(expense => new Date(expense.date) <= endDate);
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }
    
    return filtered;
  };
  
  const filteredExpenses = filterExpenses();
  
  const calculateTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };
  
  const generateCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {};
    
    filteredExpenses.forEach(expense => {
      const categoryId = expense.category;
      if (breakdown[categoryId]) {
        breakdown[categoryId] += expense.amount;
      } else {
        breakdown[categoryId] = expense.amount;
      }
    });
    
    return breakdown;
  };
  
  const categoryBreakdown = generateCategoryBreakdown();
  
  const saveReportTemplate = () => {
    // This function would be implemented to save the current report configuration
    console.log("Saving report template with configuration:", {
      reportType,
      familyId: selectedFamily?.id,
      startDate,
      endDate,
      categoryId: selectedCategory
    });
  };
  
  const loadReportTemplate = (id: string) => {
    // This function would load a saved report template
    const template = templates.find(t => t.id === id);
    if (template && template.config) {
      setReportType(template.config.reportType || 'expenses');
      setSelectedCategory(template.config.categoryId);
      // Set other filter parameters as needed
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <AppBreadcrumbs currentPage="Reports" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate insights from your financial data
          </p>
        </div>
        
        <div className="mb-6">
          <FamilySelector />
        </div>
        
        {!selectedFamily ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Please select a family</CardTitle>
              <CardDescription>
                Select a family to view reports for their expenses
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Tabs defaultValue="expenses" onValueChange={setReportType} className="mb-8">
              <TabsList>
                <TabsTrigger value="expenses">
                  <ListFilter className="h-4 w-4 mr-2" />
                  Expense Analysis
                </TabsTrigger>
                <TabsTrigger value="category">
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Category Breakdown
                </TabsTrigger>
                <TabsTrigger value="time">
                  <Calendar className="h-4 w-4 mr-2" />
                  Time Trends
                </TabsTrigger>
              </TabsList>
              
              <div className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Report Filters</CardTitle>
                    <CardDescription>
                      Customize your report parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <label className="text-sm font-medium">Start Date</label>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal w-full",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              {startDate ? format(startDate, "MMM d, yyyy") : <span>Select start date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <label className="text-sm font-medium">End Date</label>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal w-full",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              {endDate ? format(endDate, "MMM d, yyyy") : <span>Select end date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                          <label className="text-sm font-medium">Category</label>
                        </div>
                        <CategorySelector
                          value={selectedCategory}
                          onChange={setSelectedCategory}
                          includeAllOption={true}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setStartDate(undefined);
                          setEndDate(undefined);
                          setSelectedCategory(undefined);
                        }}
                      >
                        Clear Filters
                      </Button>
                      <Button onClick={() => saveReportTemplate()}>
                        Save Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <TabsContent value="expenses" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Expense Analysis</CardTitle>
                      <CardDescription>
                        Detailed breakdown of expenses for the selected period
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-muted-foreground text-sm">Total Expenses</div>
                            <div className="text-3xl font-bold mt-1">${calculateTotalAmount().toFixed(2)}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-muted-foreground text-sm">Number of Transactions</div>
                            <div className="text-3xl font-bold mt-1">{filteredExpenses.length}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6">
                            <div className="text-muted-foreground text-sm">Average Transaction</div>
                            <div className="text-3xl font-bold mt-1">
                              ${filteredExpenses.length > 0 
                                ? (calculateTotalAmount() / filteredExpenses.length).toFixed(2) 
                                : '0.00'}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="p-3 text-left font-medium">Date</th>
                              <th className="p-3 text-left font-medium">Description</th>
                              <th className="p-3 text-left font-medium">Category</th>
                              <th className="p-3 text-left font-medium">Place</th>
                              <th className="p-3 text-right font-medium">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredExpenses.length > 0 ? (
                              filteredExpenses.map((expense) => {
                                const category = categories.find(c => c.id === expense.category);
                                return (
                                  <tr key={expense.id} className="border-t">
                                    <td className="p-3">{format(new Date(expense.date), 'MMM d, yyyy')}</td>
                                    <td className="p-3">{expense.description}</td>
                                    <td className="p-3">
                                      <span
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                                        style={{ backgroundColor: `${category?.color}15`, color: category?.color }}
                                      >
                                        {category?.name || 'Uncategorized'}
                                      </span>
                                    </td>
                                    <td className="p-3">{expense.place}</td>
                                    <td className="p-3 text-right font-medium">${expense.amount.toFixed(2)}</td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                  No expenses found for the selected filters
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {filteredExpenses.length > 0 && (
                        <div className="flex justify-end mt-4">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="category" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Breakdown</CardTitle>
                      <CardDescription>
                        Analysis of spending by category
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(categoryBreakdown).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(categoryBreakdown).map(([categoryId, amount]) => {
                            const category = categories.find(c => c.id === categoryId);
                            const percentage = (amount / calculateTotalAmount()) * 100;
                            
                            return (
                              <div key={categoryId} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: category?.color || '#CBD5E1' }}
                                  />
                                  <span>{category?.name || 'Uncategorized'}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right font-medium">${amount.toFixed(2)}</div>
                                  <Badge variant="secondary" className="w-16 justify-center">
                                    {percentage.toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          No expenses found for the selected filters
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="time" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Trends</CardTitle>
                      <CardDescription>
                        View how your spending changes over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {filteredExpenses.length > 0 ? (
                        <div className="h-80 flex items-center justify-center">
                          <p className="text-muted-foreground">
                            Time trend analysis is available in the full version
                          </p>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          No expenses found for the selected filters
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
            
            {templates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Reports</CardTitle>
                  <CardDescription>
                    Load previously configured reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={templateId} onValueChange={(value) => {
                    setTemplateId(value);
                    loadReportTemplate(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved report" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
