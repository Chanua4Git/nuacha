import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { useDemoExpense } from './DemoExpenseContext';

const DemoAwareFamilySelector = () => {
  const { selectedFamily, expenses } = useDemoExpense();
  
  if (!selectedFamily) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4" />
          Demo Family
          <Badge variant="secondary" className="text-xs">Demo Mode</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <h3 className="font-medium">{selectedFamily.name}</h3>
          <p className="text-sm text-muted-foreground">{selectedFamily.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{expenses.length} expenses tracked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoAwareFamilySelector;