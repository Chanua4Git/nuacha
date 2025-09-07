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
import { useDemoIncomeSource } from '@/hooks/useDemoIncomeSource';
import { formatTTD, toMonthly, getFrequencyDisplay } from '@/utils/budgetUtils';
import { IncomeSource, FrequencyType } from '@/types/budget';
import { Plus, Edit, Trash2, DollarSign, Heart, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DemoAwareIncomeManager() {
  const { incomeSources, loading, createIncomeSource, updateIncomeSource, deleteIncomeSource } = useDemoIncomeSource();
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
      {/* Demo Mode Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <Heart className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Demo Mode - Full Income Management Experience</strong>
          <br />
          Try all features! Add, edit, and manage income sources. In the full app, your data is saved securely and used for budget calculations.
        </AlertDescription>
      </Alert>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Income Summary - Demo Family
            <Badge variant="secondary" className="ml-2">
              Demo Data
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{formatTTD(totalMonthlyIncome)}</div>
          <p className="text-sm text-muted-foreground mt-1">
            Total monthly equivalent from {incomeSources.length} income source{incomeSources.length !== 1 ? 's' : ''}
          </p>
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
                    <TableCell className="font-semibold text-green-600">
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

      {/* Demo Information */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium mb-2">How Income Management Works in the Full App</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatically sync with budget calculations and spending tracking</li>
                <li>• Support for multiple families with separate income streams</li>
                <li>• Integration with budget templates for comprehensive planning</li>
                <li>• Historical income tracking and trend analysis</li>
                <li>• Secure data storage with automatic backups</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Ready to Track Your Real Income?</h3>
          <p className="text-muted-foreground mb-4">
            Connect multiple income sources, set up automatic calculations, and see how your earnings support your family's budget goals.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/options">View All Solutions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}