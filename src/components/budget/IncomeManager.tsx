import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIncomeSource } from '@/hooks/useIncomeSource';
import { formatTTD, toMonthly, getFrequencyDisplay } from '@/utils/budgetUtils';
import { IncomeSource, FrequencyType } from '@/types/budget';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function IncomeManager() {
  const { incomeSources, loading, createIncomeSource, updateIncomeSource, deleteIncomeSource } = useIncomeSource();
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'monthly' as FrequencyType,
    amount_ttd: 0,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const totalMonthlyIncome = incomeSources.reduce((sum, source) => {
    return sum + toMonthly(source.amount_ttd, source.frequency);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Income Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatTTD(totalMonthlyIncome)}</div>
          <p className="text-sm text-muted-foreground">Total monthly income from {incomeSources.length} sources</p>
        </CardContent>
      </Card>

      {/* Income Sources Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Income Sources</CardTitle>
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : incomeSources.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No income sources yet.</p>
              <p className="text-sm">Add your first income source to get started.</p>
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
    </div>
  );
}