import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useIncomeSource } from '@/hooks/useIncomeSource';
import { useBudgetTemplates } from '@/hooks/useBudgetTemplates';
import { formatTTD, toMonthly, getFrequencyDisplay } from '@/utils/budgetUtils';
import { IncomeSource, FrequencyType } from '@/types/budget';
import { Plus, Edit, Trash2, DollarSign, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useExpense } from '@/context/ExpenseContext';

export default function IncomeManager() {
  const { selectedFamily } = useExpense();
  const { incomeSources, loading, createIncomeSource, updateIncomeSource, deleteIncomeSource } = useIncomeSource(selectedFamily?.id);
  const { templates, isLoading: templatesLoading, getDefaultTemplate } = useBudgetTemplates(selectedFamily?.id);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'monthly' as FrequencyType,
    amount_ttd: 0,
    notes: ''
  });

  const activeTemplate = getDefaultTemplate();
  const hasTemplateIncome = activeTemplate?.template_data?.income && Object.keys(activeTemplate.template_data.income).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFamily) {
      toast.error('Please select a family first');
      return;
    }
    
    if (!formData.name.trim() || formData.amount_ttd <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const sourceData = {
      name: formData.name.trim(),
      frequency: formData.frequency,
      amount_ttd: formData.amount_ttd,
      notes: formData.notes.trim() || '',
      is_active: true
    };

    let success = false;
    if (editingSource) {
      const result = await updateIncomeSource(editingSource.id, sourceData);
      success = !!result;
    } else {
      const result = await createIncomeSource(sourceData);
      success = !!result;
    }

    if (success) {
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (source: IncomeSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      frequency: source.frequency,
      amount_ttd: source.amount_ttd,
      notes: source.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this income source?')) {
      await deleteIncomeSource(id);
    }
  };

  const resetForm = () => {
    setEditingSource(null);
    setFormData({
      name: '',
      frequency: 'monthly',
      amount_ttd: 0,
      notes: ''
    });
  };

  // Calculate template income if available
  const templateIncome = hasTemplateIncome 
    ? Object.values(activeTemplate!.template_data!.income!).reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0)
    : 0;

  const manualIncome = incomeSources.reduce((sum, source) => {
    return sum + toMonthly(source.amount_ttd, source.frequency);
  }, 0);

  // Show template income as primary source
  const totalMonthlyIncome = hasTemplateIncome ? templateIncome : manualIncome;

  return (
    <div className="space-y-6">
      {!selectedFamily ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <p>Please select a family to manage income sources.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Template Income Alert */}
          {hasTemplateIncome && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Income is managed via Budget Template</strong>
                <br />
                Your income is currently set through your budget template "{activeTemplate?.name}". 
                Template income takes priority over manual entries.
              </AlertDescription>
            </Alert>
          )}

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Income Summary - {selectedFamily.name}
                {hasTemplateIncome && (
                  <Badge variant="secondary" className="ml-2">
                    <FileText className="h-3 w-3 mr-1" />
                    From Template
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatTTD(totalMonthlyIncome)}</div>
              <p className="text-xs text-muted-foreground">
                {hasTemplateIncome ? (
                  <>Template income • {Object.keys(activeTemplate!.template_data!.income!).length} source{Object.keys(activeTemplate!.template_data!.income!).length !== 1 ? 's' : ''}</>
                ) : (
                  <>Manual income sources • {incomeSources.length} source{incomeSources.length !== 1 ? 's' : ''}</>
                )}
              </p>
              {hasTemplateIncome && manualIncome > 0 && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">
                    <Info className="h-3 w-3 inline mr-1" />
                    Additional manual sources ({formatTTD(manualIncome)}) are available but not used in calculations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Template Income Display */}
      {hasTemplateIncome && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Income Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(activeTemplate!.template_data!.income!).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <p className="text-xs text-muted-foreground">Managed via template</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatTTD(Number(value))}</div>
                    <div className="text-xs text-muted-foreground">Monthly</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/budget?tab=builder', '_blank')}
                className="w-full"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Template Income
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Sources Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {hasTemplateIncome ? 'Additional Income Sources' : 'Income Sources'}
            {hasTemplateIncome && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (For reference only - template income is used in calculations)
              </span>
            )}
          </CardTitle>
          {!hasTemplateIncome && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income Source
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSource ? 'Edit Income Source' : 'Add Income Source'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Source Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Primary Job, Freelance, Rental Income"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Amount (TTD) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount_ttd || ''}
                    onChange={(e) => setFormData({ ...formData, amount_ttd: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value as FrequencyType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingSource ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
          {hasTemplateIncome && (
            <Button variant="outline" size="sm" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reference Source
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : incomeSources.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>{hasTemplateIncome ? 'No additional income sources.' : 'No income sources yet.'}</p>
              <p className="text-sm">
                {hasTemplateIncome 
                  ? 'Your template income is being used for calculations.' 
                  : 'Add your first income source to get started.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Monthly Equivalent</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>{formatTTD(source.amount_ttd)}</TableCell>
                    <TableCell>{getFrequencyDisplay(source.frequency)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatTTD(toMonthly(source.amount_ttd, source.frequency))}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {source.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(source)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </>
      )}
    </div>
  );
}