import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Edit, Printer, Calendar, MapPin, Users } from 'lucide-react';
import { formatTTD } from '@/utils/budgetUtils';
import { useBudgetTemplates } from '@/hooks/useBudgetTemplates';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { useExpense } from '@/context/ExpenseContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

export default function BudgetTemplateReport() {
  const { user } = useAuth();
  const { selectedFamily } = useExpense();
  const { templates } = useBudgetTemplates(selectedFamily?.id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const templateId = searchParams.get('templateId');
  const template = templates.find(t => t.id === templateId);

  if (!template) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Template not found.</p>
        </CardContent>
      </Card>
    );
  }

  const templateData = template.template_data;
  
  // Calculate totals
  const totalIncome = (templateData.income ? Object.values(templateData.income).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) : 0);
  const totalNeeds = (templateData.needs ? Object.values(templateData.needs).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) : 0);
  const totalWants = (templateData.wants ? Object.values(templateData.wants).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) : 0);
  const totalSavings = (templateData.savings ? Object.values(templateData.savings).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0) : 0);
  const totalBudget = totalNeeds + totalWants + totalSavings;
  const surplus = totalIncome - totalBudget;

  // Calculate percentages
  const needsPercentage = totalIncome > 0 ? (totalNeeds / totalIncome) * 100 : 0;
  const wantsPercentage = totalIncome > 0 ? (totalWants / totalIncome) * 100 : 0;
  const savingsPercentage = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  const handleEdit = () => {
    navigate(`/budget?tab=builder&mode=edit&templateId=${templateId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header Actions - Hidden in print */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate('/budget?tab=dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Template
          </Button>
        </div>
      </div>

      {/* Report Header */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl print:text-3xl">Budget Template Report</CardTitle>
          <div className="space-y-2 text-muted-foreground">
            <h2 className="text-xl font-semibold">{template.name}</h2>
            {template.description && <p>{template.description}</p>}
            <div className="flex items-center justify-center gap-4 text-sm print:text-base">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created: {new Date(template.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                Updated: {new Date(template.updated_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* About You Section */}
      {templateData.aboutYou && (
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              About You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 print:grid-cols-4">
              {templateData.aboutYou.name && (
                <div>
                  <p className="font-medium">Name</p>
                  <p className="text-muted-foreground">{templateData.aboutYou.name}</p>
                </div>
              )}
              {templateData.aboutYou.location && (
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {templateData.aboutYou.location}
                  </p>
                </div>
              )}
              {templateData.aboutYou.household_size && (
                <div>
                  <p className="font-medium">Household Size</p>
                  <p className="text-muted-foreground">{templateData.aboutYou.household_size}</p>
                </div>
              )}
              {templateData.aboutYou.dependents && (
                <div>
                  <p className="font-medium">Dependents</p>
                  <p className="text-muted-foreground">{templateData.aboutYou.dependents}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Summary */}
      <Card className="print:shadow-none print:border">
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{formatTTD(totalIncome)}</p>
              <p className="text-sm text-muted-foreground">Total Income</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{formatTTD(totalNeeds)}</p>
              <p className="text-sm text-muted-foreground">Needs ({needsPercentage.toFixed(1)}%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{formatTTD(totalWants)}</p>
              <p className="text-sm text-muted-foreground">Wants ({wantsPercentage.toFixed(1)}%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatTTD(totalSavings)}</p>
              <p className="text-sm text-muted-foreground">Savings ({savingsPercentage.toFixed(1)}%)</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${surplus >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {formatTTD(surplus)}
              </p>
              <p className="text-sm text-muted-foreground">
                {surplus >= 0 ? 'Surplus' : 'Deficit'}
              </p>
            </div>
          </div>

          {/* 50/30/20 Rule Comparison */}
          <div className="space-y-3">
            <h4 className="font-semibold">Budget Allocation vs 50/30/20 Rule</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Needs: {needsPercentage.toFixed(1)}% (Target: 50%)</span>
                  <Badge variant={needsPercentage <= 55 ? "default" : "destructive"}>
                    {needsPercentage <= 55 ? "On Track" : "Over Budget"}
                  </Badge>
                </div>
                <Progress value={Math.min(needsPercentage, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Wants: {wantsPercentage.toFixed(1)}% (Target: 30%)</span>
                  <Badge variant={wantsPercentage <= 35 ? "default" : "destructive"}>
                    {wantsPercentage <= 35 ? "On Track" : "Over Budget"}
                  </Badge>
                </div>
                <Progress value={Math.min(wantsPercentage, 100)} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Savings: {savingsPercentage.toFixed(1)}% (Target: 20%)</span>
                  <Badge variant={savingsPercentage >= 15 ? "default" : "secondary"}>
                    {savingsPercentage >= 15 ? "Good" : "Could Improve"}
                  </Badge>
                </div>
                <Progress value={Math.min(savingsPercentage, 100)} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Details */}
      {templateData.income && Object.keys(templateData.income).length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {Object.entries(templateData.income).map(([key, value]) => (
                Number(value) > 0 && (
                  <div key={key} className="flex justify-between items-center">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="font-semibold">{formatTTD(Number(value))}</span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Needs Categories */}
      {templateData.needs && Object.keys(templateData.needs).length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="text-destructive">Needs ({formatTTD(totalNeeds)})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.entries(templateData.needs).map(([key, value]) => (
                Number(value) > 0 && (
                  <div key={key} className="flex justify-between items-center">
                    <span className="capitalize">{key.replace(/[-_]/g, ' ')}</span>
                    <span className="font-semibold">{formatTTD(Number(value))}</span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wants Categories */}
      {templateData.wants && Object.keys(templateData.wants).length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="text-amber-600">Wants ({formatTTD(totalWants)})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.entries(templateData.wants).map(([key, value]) => (
                Number(value) > 0 && (
                  <div key={key} className="flex justify-between items-center">
                    <span className="capitalize">{key.replace(/[-_]/g, ' ')}</span>
                    <span className="font-semibold">{formatTTD(Number(value))}</span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Savings Categories */}
      {templateData.savings && Object.keys(templateData.savings).length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="text-green-600">Savings & Investments ({formatTTD(totalSavings)})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {Object.entries(templateData.savings).map(([key, value]) => (
                Number(value) > 0 && (
                  <div key={key} className="flex justify-between items-center">
                    <span className="capitalize">{key.replace(/[-_]/g, ' ')}</span>
                    <span className="font-semibold">{formatTTD(Number(value))}</span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {templateData.notes && (
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{templateData.notes}</p>
          </CardContent>
        </Card>
      )}

      <Separator className="print:hidden" />

      {/* Footer - Hidden in print */}
      <div className="flex justify-center print:hidden pb-6">
        <Button onClick={handleEdit} size="lg">
          <Edit className="h-4 w-4 mr-2" />
          Edit This Template
        </Button>
      </div>
    </div>
  );
}