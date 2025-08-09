import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { formatTTD, getFrequencyDisplay, toMonthly } from '@/utils/budgetUtils';
import { FrequencyType } from '@/types/budget';
import { toast } from 'sonner';

// Mock income sources for demo
const demoIncomeSources = [
  {
    id: '1',
    name: 'Primary Salary',
    frequency: 'monthly' as FrequencyType,
    amount_ttd: 8000,
    notes: 'Main job income'
  },
  {
    id: '2', 
    name: 'Part-time Work',
    frequency: 'weekly' as FrequencyType,
    amount_ttd: 600,
    notes: 'Weekend consultancy'
  },
  {
    id: '3',
    name: 'Investment Returns',
    frequency: 'yearly' as FrequencyType,
    amount_ttd: 12000,
    notes: 'Annual dividend payments'
  }
];

export default function DemoIncomeManager() {
  const [incomeSources] = useState(demoIncomeSources);

  const handleAddIncome = () => {
    toast("Sign up to add your real income sources", {
      description: "This is just a demo. In the full app, you can add and manage all your income streams."
    });
  };

  const handleEditIncome = (id: string) => {
    toast("Sign up to edit income sources", {
      description: "This is just a demo showing how income management works."
    });
  };

  const handleDeleteIncome = (id: string) => {
    toast("Sign up to manage income sources", {
      description: "This is just a demo showing the income management interface."
    });
  };

  const totalMonthlyIncome = incomeSources.reduce((sum, source) => {
    return sum + toMonthly(source.amount_ttd, source.frequency);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Income Management</h2>
          <p className="text-muted-foreground">Manage all your income sources and frequencies</p>
        </div>
        <Button onClick={handleAddIncome}>
          <Plus className="h-4 w-4 mr-2" />
          Add Income Source
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Income Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatTTD(totalMonthlyIncome)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Total monthly equivalent from {incomeSources.length} income sources
          </p>
        </CardContent>
      </Card>

      {/* Income Sources List */}
      <div className="grid gap-4">
        {incomeSources.map((source) => (
          <Card key={source.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{source.name}</h3>
                    <Badge variant="secondary">
                      {getFrequencyDisplay(source.frequency)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Original Amount</p>
                      <p className="font-medium">{formatTTD(source.amount_ttd)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Equivalent</p>
                      <p className="font-medium text-green-600">
                        {formatTTD(toMonthly(source.amount_ttd, source.frequency))}
                      </p>
                    </div>
                    {source.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{source.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditIncome(source.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteIncome(source.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for Demo */}
      {incomeSources.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Income Sources Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first income source to start tracking your monthly budget
            </p>
            <Button onClick={handleAddIncome}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Income Source
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}