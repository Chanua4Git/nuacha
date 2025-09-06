import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDemoBudgetRules } from '@/hooks/useDemoBudgetRules';
import { BudgetAllocation } from '@/types/budget';
import { Target, Plus, Edit, Trash2, Heart, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DemoAwareRulesManager() {
  const { rules, activeRule, loading, createRule, updateRule, deleteRule } = useDemoBudgetRules();
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    needs_pct: 50,
    wants_pct: 30,
    savings_pct: 20
  });

  const handleCreateRule = async () => {
    if (!isValidRule(newRule.needs_pct, newRule.wants_pct, newRule.savings_pct)) {
      return;
    }
    
    if (!newRule.rule_name.trim()) {
      return;
    }

    await createRule({
      ...newRule,
      rule_name: newRule.rule_name.trim(),
      is_default: false
    });

    setNewRule({
      rule_name: '',
      needs_pct: 50,
      wants_pct: 30,
      savings_pct: 20
    });
    setIsCreating(false);
  };

  const handleSetDefault = async (id: string) => {
    await updateRule(id, { is_default: true });
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteRule(id);
    }
  };

  const isValidRule = (needs: number, wants: number, savings: number) => {
    return needs + wants + savings === 100;
  };

  const getRuleStatusIcon = (rule: BudgetAllocation) => {
    if (rule.is_default) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return null;
  };

  const getRuleStatusBadge = (rule: BudgetAllocation) => {
    if (rule.is_default) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Available</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <Heart className="h-4 w-4 text-primary" />
        <AlertDescription>
          <strong>Demo Mode - Full Rules Management Experience</strong>
          <br />
          Create custom budget allocation rules and see how they affect your financial planning. Try the 50/30/20 rule or create your own!
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Budget Allocation Rules
          </h2>
          <p className="text-muted-foreground">
            Define how you want to allocate your income across needs, wants, and savings
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Rule
        </Button>
      </div>

      {/* Active Rule Display */}
      {activeRule && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Active Rule: {activeRule.rule_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{activeRule.needs_pct}%</div>
                <div className="text-sm text-muted-foreground">Needs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{activeRule.wants_pct}%</div>
                <div className="text-sm text-muted-foreground">Wants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{activeRule.savings_pct}%</div>
                <div className="text-sm text-muted-foreground">Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Rule Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Budget Rule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                value={newRule.rule_name}
                onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                placeholder="e.g., Conservative Budget, Aggressive Savings"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="needs">Needs (%)</Label>
                <Input
                  id="needs"
                  type="number"
                  min="0"
                  max="100"
                  value={newRule.needs_pct}
                  onChange={(e) => setNewRule({ ...newRule, needs_pct: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="wants">Wants (%)</Label>
                <Input
                  id="wants"
                  type="number"
                  min="0"
                  max="100"
                  value={newRule.wants_pct}
                  onChange={(e) => setNewRule({ ...newRule, wants_pct: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="savings">Savings (%)</Label>
                <Input
                  id="savings"
                  type="number"
                  min="0"
                  max="100"
                  value={newRule.savings_pct}
                  onChange={(e) => setNewRule({ ...newRule, savings_pct: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm">
                Total: {newRule.needs_pct + newRule.wants_pct + newRule.savings_pct}%
              </div>
              {!isValidRule(newRule.needs_pct, newRule.wants_pct, newRule.savings_pct) && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Must equal 100%</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateRule}
                disabled={!isValidRule(newRule.needs_pct, newRule.wants_pct, newRule.savings_pct) || !newRule.rule_name.trim()}
              >
                Create Rule
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Rules</h3>
        {rules.map(rule => (
          <Card key={rule.id} className={rule.is_default ? 'border-green-200' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getRuleStatusIcon(rule)}
                    <h4 className="font-semibold">{rule.rule_name}</h4>
                    {getRuleStatusBadge(rule)}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Needs</div>
                      <div className="text-lg font-medium text-destructive">{rule.needs_pct}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Wants</div>
                      <div className="text-lg font-medium text-orange-600">{rule.wants_pct}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Savings</div>
                      <div className="text-lg font-medium text-green-600">{rule.savings_pct}%</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!rule.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(rule.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Set Active
                    </Button>
                  )}
                  {rule.rule_name !== '50/30/20 Rule' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo Information */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium mb-2">How Budget Rules Work in the Full App</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatically applied to your budget dashboard and variance calculations</li>
                <li>• Used in scenario planning to test different allocation strategies</li>
                <li>• Integrated with expense tracking to show real-time compliance</li>
                <li>• Historical analysis of how well you stick to your chosen rules</li>
                <li>• Personalized recommendations based on your spending patterns</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Ready to Apply These Rules to Your Real Budget?</h3>
          <p className="text-muted-foreground mb-4">
            Create custom budget allocation rules that work for your family's unique financial situation and watch your money management improve.
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