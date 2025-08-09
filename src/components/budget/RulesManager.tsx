import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useBudgetRules } from '@/hooks/useBudgetRules';
import { BudgetAllocation } from '@/types/budget';
import { Plus, Edit, Trash2, Target, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function RulesManager() {
  const { rules, activeRule, loading, createRule, updateRule, deleteRule } = useBudgetRules();
  const [editingRule, setEditingRule] = useState<BudgetAllocation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    needs_pct: 50,
    wants_pct: 30,
    savings_pct: 20,
    is_default: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const total = formData.needs_pct + formData.wants_pct + formData.savings_pct;
    if (total !== 100) {
      toast.error('Percentages must add up to exactly 100%');
      return;
    }

    if (!formData.rule_name.trim()) {
      toast.error('Please enter a rule name');
      return;
    }

    const ruleData = {
      rule_name: formData.rule_name.trim(),
      needs_pct: formData.needs_pct,
      wants_pct: formData.wants_pct,
      savings_pct: formData.savings_pct,
      is_default: formData.is_default
    };

    let success = false;
    if (editingRule) {
      const result = await updateRule(editingRule.id, ruleData);
      success = !!result;
    } else {
      const result = await createRule(ruleData);
      success = !!result;
    }

    if (success) {
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (rule: BudgetAllocation) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      needs_pct: rule.needs_pct,
      wants_pct: rule.wants_pct,
      savings_pct: rule.savings_pct,
      is_default: rule.is_default
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this budget rule?')) {
      await deleteRule(id);
    }
  };

  const handleSetDefault = async (rule: BudgetAllocation) => {
    await updateRule(rule.id, { is_default: true });
  };

  const resetForm = () => {
    setEditingRule(null);
    setFormData({
      rule_name: '',
      needs_pct: 50,
      wants_pct: 30,
      savings_pct: 20,
      is_default: false
    });
  };

  const total = formData.needs_pct + formData.wants_pct + formData.savings_pct;
  const isValidTotal = total === 100;

  return (
    <div className="space-y-6">
      {/* Active Rule Display */}
      {activeRule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Active Budget Rule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                <h3 className="font-medium text-red-800">Needs</h3>
                <div className="text-3xl font-bold text-red-600 mt-2">
                  {activeRule.needs_pct}%
                </div>
                <p className="text-sm text-red-600 mt-1">Essential expenses</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                <h3 className="font-medium text-orange-800">Wants</h3>
                <div className="text-3xl font-bold text-orange-600 mt-2">
                  {activeRule.wants_pct}%
                </div>
                <p className="text-sm text-orange-600 mt-1">Lifestyle choices</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <h3 className="font-medium text-green-800">Savings</h3>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {activeRule.savings_pct}%
                </div>
                <p className="text-sm text-green-600 mt-1">Future security</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="text-sm">
                Current Rule: {activeRule.rule_name}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Rules Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Rules</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Budget Rule' : 'Create Budget Rule'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name *</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., 50/30/20 Rule, Conservative Budget"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="needs_pct">Needs %</Label>
                    <Input
                      id="needs_pct"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.needs_pct || ''}
                      onChange={(e) => setFormData({ ...formData, needs_pct: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="wants_pct">Wants %</Label>
                    <Input
                      id="wants_pct"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.wants_pct || ''}
                      onChange={(e) => setFormData({ ...formData, wants_pct: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="savings_pct">Savings %</Label>
                    <Input
                      id="savings_pct"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.savings_pct || ''}
                      onChange={(e) => setFormData({ ...formData, savings_pct: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`text-sm ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
                    Total: {total}% {isValidTotal ? '✓' : '(must equal 100%)'}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={!isValidTotal}
                  >
                    {editingRule ? 'Update' : 'Create'}
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
          ) : rules.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No budget rules created yet.</p>
              <p className="text-sm">Start with the popular 50/30/20 rule.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Needs %</TableHead>
                  <TableHead>Wants %</TableHead>
                  <TableHead>Savings %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>{rule.needs_pct}%</TableCell>
                    <TableCell>{rule.wants_pct}%</TableCell>
                    <TableCell>{rule.savings_pct}%</TableCell>
                    <TableCell>
                      {rule.is_default ? (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => handleSetDefault(rule)}
                        >
                          Set Active
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id)}
                          disabled={rule.is_default}
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

      {/* Popular Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Budget Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">50/30/20 Rule</h3>
              <p className="text-sm text-muted-foreground mt-1">
                50% needs, 30% wants, 20% savings. Great for beginners.
              </p>
              <div className="flex gap-2 mt-3 text-xs">
                <Badge variant="outline">Needs: 50%</Badge>
                <Badge variant="outline">Wants: 30%</Badge>
                <Badge variant="outline">Savings: 20%</Badge>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">70/20/10 Rule</h3>
              <p className="text-sm text-muted-foreground mt-1">
                70% needs, 20% wants, 10% savings. For tight budgets.
              </p>
              <div className="flex gap-2 mt-3 text-xs">
                <Badge variant="outline">Needs: 70%</Badge>
                <Badge variant="outline">Wants: 20%</Badge>
                <Badge variant="outline">Savings: 10%</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}