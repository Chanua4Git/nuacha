import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Mock budget rules for demo
const demoBudgetRules = [
  {
    id: '1',
    rule_name: '50/30/20 Rule',
    needs_pct: 50,
    wants_pct: 30,
    savings_pct: 20,
    is_default: true
  },
  {
    id: '2',
    rule_name: 'Conservative Saver',
    needs_pct: 45,
    wants_pct: 25,
    savings_pct: 30,
    is_default: false
  },
  {
    id: '3',
    rule_name: 'Aggressive Growth',
    needs_pct: 40,
    wants_pct: 20,
    savings_pct: 40,
    is_default: false
  }
];

export default function DemoRulesManager() {
  const [rules] = useState(demoBudgetRules);
  const [activeRule] = useState(demoBudgetRules.find(r => r.is_default));
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    needs_pct: 50,
    wants_pct: 30,
    savings_pct: 20
  });

  const handleCreateRule = () => {
    const total = newRule.needs_pct + newRule.wants_pct + newRule.savings_pct;
    if (total !== 100) {
      toast.error("Percentages must add up to 100%");
      return;
    }

    toast("Sign up to create custom budget rules", {
      description: "This is just a demo. In the full app, you can create and customize budget allocation rules."
    });
    
    setIsCreating(false);
    setNewRule({ rule_name: '', needs_pct: 50, wants_pct: 30, savings_pct: 20 });
  };

  const handleSetDefault = (id: string) => {
    toast("Sign up to activate budget rules", {
      description: "This is just a demo showing how you can switch between different budget allocation strategies."
    });
  };

  const handleDeleteRule = (id: string) => {
    toast("Sign up to manage budget rules", {
      description: "This is just a demo showing the rule management interface."
    });
  };

  const isValidRule = (needs: number, wants: number, savings: number) => {
    return needs + wants + savings === 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Budget Rules</h2>
          <p className="text-muted-foreground">Define how your income should be allocated across needs, wants, and savings</p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Rule
        </Button>
      </div>

      {/* Active Rule Card */}
      {activeRule && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Active Rule: {activeRule.rule_name}
              </CardTitle>
              <Badge className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{activeRule.needs_pct}%</div>
                <div className="text-sm text-red-700">Needs</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{activeRule.wants_pct}%</div>
                <div className="text-sm text-blue-700">Wants</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{activeRule.savings_pct}%</div>
                <div className="text-sm text-green-700">Savings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create New Rule */}
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
                placeholder="My Custom Rule"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="needs-pct">Needs (%)</Label>
                <Input
                  id="needs-pct"
                  type="number"
                  min="0"
                  max="100"
                  value={newRule.needs_pct}
                  onChange={(e) => setNewRule({ ...newRule, needs_pct: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="wants-pct">Wants (%)</Label>
                <Input
                  id="wants-pct"
                  type="number"
                  min="0"
                  max="100"
                  value={newRule.wants_pct}
                  onChange={(e) => setNewRule({ ...newRule, wants_pct: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="savings-pct">Savings (%)</Label>
                <Input
                  id="savings-pct"
                  type="number"
                  min="0"
                  max="100"
                  value={newRule.savings_pct}
                  onChange={(e) => setNewRule({ ...newRule, savings_pct: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Total: {newRule.needs_pct + newRule.wants_pct + newRule.savings_pct}% 
              {!isValidRule(newRule.needs_pct, newRule.wants_pct, newRule.savings_pct) && (
                <span className="text-red-600 ml-2">Must equal 100%</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateRule}
                disabled={!isValidRule(newRule.needs_pct, newRule.wants_pct, newRule.savings_pct) || !newRule.rule_name}
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
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={rule.is_default ? 'border-primary bg-primary/5' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{rule.rule_name}</h4>
                      {rule.is_default && (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Needs:</span>
                        <span className="ml-2 font-medium">{rule.needs_pct}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Wants:</span>
                        <span className="ml-2 font-medium">{rule.wants_pct}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Savings:</span>
                        <span className="ml-2 font-medium">{rule.savings_pct}%</span>
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
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={rule.is_default}
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
      </div>
    </div>
  );
}