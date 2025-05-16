
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FamilySelector from '@/components/FamilySelector';
import CategoryManager from '@/components/accounting/CategoryManager';
import BudgetManager from '@/components/accounting/BudgetManager';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Accounting = () => {
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');

  // Sample data for the budget vs actual chart (to be replaced with real data)
  const sampleData = [
    { name: 'Groceries', budget: 500, actual: 450 },
    { name: 'Dining', budget: 300, actual: 340 },
    { name: 'Transportation', budget: 200, actual: 180 },
    { name: 'Utilities', budget: 250, actual: 240 },
    { name: 'Entertainment', budget: 150, actual: 200 },
    { name: 'Misc', budget: 100, actual: 120 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Household Accounting</h1>
          <p className="text-muted-foreground mt-1">
            A softer way to track spending and budgeting
          </p>
        </div>
        
        <div className="mb-8">
          <FamilySelector onFamilyChange={setSelectedFamilyId} />
        </div>
        
        {selectedFamilyId ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Overview</CardTitle>
                    <CardDescription>Current month's budget vs. actual spending</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={sampleData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`$${value}`, undefined]}
                            labelStyle={{ color: '#2F2F2F' }}
                            contentStyle={{ 
                              backgroundColor: '#FAF9F7',
                              border: '1px solid #5A7684',
                              borderRadius: '8px',
                              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend />
                          <Bar dataKey="budget" name="Budget" fill="#5A7684" />
                          <Bar dataKey="actual" name="Actual" fill="#C3DCD1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Top Spending Categories</CardTitle>
                    <CardDescription>Where most of your money is going</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sampleData
                        .sort((a, b) => b.actual - a.actual)
                        .map((category, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: index === 0 ? '#F1CBC7' : 
                                         index === 1 ? '#C3DCD1' : '#5A7684' }} 
                              />
                              <span>{category.name}</span>
                            </div>
                            <div className="font-medium">${category.actual}</div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Soon, you'll see your latest transactions here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="categories">
              <CategoryManager familyId={selectedFamilyId} />
            </TabsContent>
            
            <TabsContent value="budgets">
              <BudgetManager familyId={selectedFamilyId} />
            </TabsContent>
            
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports</CardTitle>
                  <CardDescription>Generate custom financial reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8">
                    <p className="text-muted-foreground mb-4">
                      Report generation features are coming soon.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You'll be able to create custom reports, save report templates, 
                      and export data for deeper analysis.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Select a Family</CardTitle>
              <CardDescription>
                Please select a family to view and manage accounting data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Use the family selector above to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Accounting;
