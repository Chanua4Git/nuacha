import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Play } from 'lucide-react';
import { formatTTD } from '@/utils/budgetUtils';
import { toast } from 'sonner';

// Base scenario data
const baseScenario = {
  income: 12000,
  needs: 5500,
  wants: 2800,
  savings: 1200
};

// Predefined scenario changes
const scenarioPresets = [
  {
    name: "Night Nurse Care",
    description: "Adding weekly night nurse support",
    changes: { needs: 800 }
  },
  {
    name: "Reduce Dining Out",
    description: "Cooking more meals at home",
    changes: { wants: -600 }
  },
  {
    name: "Increase Savings",
    description: "Boost emergency fund",
    changes: { savings: 500 }
  }
];

export default function DemoScenarioPlanner() {
  const [currentScenario, setCurrentScenario] = useState({
    needs: 0,
    wants: 0,
    savings: 0
  });
  const [scenarioName, setScenarioName] = useState('');

  const calculateNewTotals = () => {
    return {
      needs: baseScenario.needs + currentScenario.needs,
      wants: baseScenario.wants + currentScenario.wants,
      savings: baseScenario.savings + currentScenario.savings,
      total: baseScenario.needs + baseScenario.wants + baseScenario.savings + 
             currentScenario.needs + currentScenario.wants + currentScenario.savings,
      surplus: baseScenario.income - (
        baseScenario.needs + baseScenario.wants + baseScenario.savings + 
        currentScenario.needs + currentScenario.wants + currentScenario.savings
      )
    };
  };

  const newTotals = calculateNewTotals();

  const applyPreset = (preset: typeof scenarioPresets[0]) => {
    setCurrentScenario({
      needs: preset.changes.needs || 0,
      wants: preset.changes.wants || 0,
      savings: preset.changes.savings || 0
    });
    setScenarioName(preset.name);
  };

  const resetScenario = () => {
    setCurrentScenario({ needs: 0, wants: 0, savings: 0 });
    setScenarioName('');
  };

  const saveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }

    toast("Sign up to save scenarios", {
      description: "This is just a demo. In the full app, you can save and compare multiple budget scenarios."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scenario Planner</h2>
          <p className="text-muted-foreground">Explore "what-if" budget scenarios and their impact</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          {/* Quick Presets */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Scenarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scenarioPresets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => applyPreset(preset)}
                >
                  <div className="text-left">
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-muted-foreground">{preset.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Manual Adjustments */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="My Custom Scenario"
                />
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="needs-change">Needs Change (TTD)</Label>
                  <Input
                    id="needs-change"
                    type="number"
                    value={currentScenario.needs}
                    onChange={(e) => setCurrentScenario({
                      ...currentScenario,
                      needs: parseInt(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="wants-change">Wants Change (TTD)</Label>
                  <Input
                    id="wants-change"
                    type="number"
                    value={currentScenario.wants}
                    onChange={(e) => setCurrentScenario({
                      ...currentScenario,
                      wants: parseInt(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="savings-change">Savings Change (TTD)</Label>
                  <Input
                    id="savings-change"
                    type="number"
                    value={currentScenario.savings}
                    onChange={(e) => setCurrentScenario({
                      ...currentScenario,
                      savings: parseInt(e.target.value) || 0
                    })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveScenario} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
                <Button variant="outline" onClick={resetScenario}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-6">
          {/* Scenario Impact */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Original vs New */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Current Budget</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Needs:</span>
                        <span>{formatTTD(baseScenario.needs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wants:</span>
                        <span>{formatTTD(baseScenario.wants)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Savings:</span>
                        <span>{formatTTD(baseScenario.savings)}</span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-medium">
                        <span>Surplus:</span>
                        <span className="text-green-600">
                          {formatTTD(baseScenario.income - (baseScenario.needs + baseScenario.wants + baseScenario.savings))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">With Scenario</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Needs:</span>
                        <span className={currentScenario.needs !== 0 ? 'font-medium' : ''}>
                          {formatTTD(newTotals.needs)}
                          {currentScenario.needs !== 0 && (
                            <span className="text-xs ml-1">
                              ({currentScenario.needs > 0 ? '+' : ''}{formatTTD(currentScenario.needs)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wants:</span>
                        <span className={currentScenario.wants !== 0 ? 'font-medium' : ''}>
                          {formatTTD(newTotals.wants)}
                          {currentScenario.wants !== 0 && (
                            <span className="text-xs ml-1">
                              ({currentScenario.wants > 0 ? '+' : ''}{formatTTD(currentScenario.wants)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Savings:</span>
                        <span className={currentScenario.savings !== 0 ? 'font-medium' : ''}>
                          {formatTTD(newTotals.savings)}
                          {currentScenario.savings !== 0 && (
                            <span className="text-xs ml-1">
                              ({currentScenario.savings > 0 ? '+' : ''}{formatTTD(currentScenario.savings)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-medium">
                        <span>Surplus:</span>
                        <span className={newTotals.surplus >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatTTD(newTotals.surplus)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Surplus Alert */}
                {newTotals.surplus < 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-700">
                      <strong>Warning:</strong> This scenario would result in a deficit of {formatTTD(Math.abs(newTotals.surplus))}
                    </div>
                  </div>
                )}

                {newTotals.surplus > (baseScenario.income - (baseScenario.needs + baseScenario.wants + baseScenario.savings)) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-700">
                      <strong>Great!</strong> This scenario would improve your financial position.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Saved Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <p>No saved scenarios yet</p>
                <p className="text-sm mt-2">Save scenarios to compare different budget strategies</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}