import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useCategories } from '@/hooks/useCategories';
import { CategorizationRule } from '@/types/receipt';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Edit, Trash2, Plus, Save, X, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const CategoryRulesManager = () => {
  const { categories } = useCategories();
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<CategorizationRule | null>(null);
  const [isAddingRule, setIsAddingRule] = useState(false);

  // Fetch existing rules
  useEffect(() => {
    const fetchRules = async () => {
      setIsLoading(true);
      
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error('No authenticated user found');
          return;
        }
        
        const userId = userData.user.id;
        
        const { data, error } = await supabase
          .from('categorization_rules')
          .select(`
            *,
            category:category_id(id, name, color)
          `)
          .eq('user_id', userId)
          .order('priority', { ascending: false });
          
        if (error) {
          console.error('Error fetching categorization rules:', error);
          return;
        }
        
        // Map to our frontend format
        const mappedRules = data.map(rule => ({
          id: rule.id,
          userId: rule.user_id,
          name: rule.name,
          pattern: rule.pattern,
          patternType: rule.pattern_type as 'vendor' | 'item' | 'description',
          categoryId: rule.category_id,
          priority: rule.priority,
          isActive: rule.is_active,
          createdAt: rule.created_at,
          updatedAt: rule.updated_at,
          category: rule.category
        }));
        
        setRules(mappedRules);
      } catch (error) {
        console.error('Unexpected error fetching rules:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRules();
  }, []);
  
  const handleAddRule = () => {
    const { data } = supabase.auth.getUser();
    if (!data?.user?.id) return;
    
    setEditingRule({
      userId: data.user.id,
      name: '',
      pattern: '',
      patternType: 'vendor',
      categoryId: '',
      priority: 0,
      isActive: true
    });
    setIsAddingRule(true);
  };
  
  const handleEditRule = (rule: CategorizationRule) => {
    setEditingRule({ ...rule });
    setIsAddingRule(false);
  };
  
  const handleSaveRule = async () => {
    if (!editingRule) return;
    
    try {
      const ruleToSave = {
        user_id: editingRule.userId,
        name: editingRule.name,
        pattern: editingRule.pattern,
        pattern_type: editingRule.patternType,
        category_id: editingRule.categoryId,
        priority: editingRule.priority || 0,
        is_active: editingRule.isActive !== false
      };
      
      let result;
      
      if (editingRule.id) {
        // Update existing rule
        const { data, error } = await supabase
          .from('categorization_rules')
          .update(ruleToSave)
          .eq('id', editingRule.id)
          .select(`
            *,
            category:category_id(id, name, color)
          `)
          .single();
          
        if (error) throw error;
        result = data;
        toast.success('Rule updated successfully');
      } else {
        // Create new rule
        const { data, error } = await supabase
          .from('categorization_rules')
          .insert([ruleToSave])
          .select(`
            *,
            category:category_id(id, name, color)
          `)
          .single();
          
        if (error) throw error;
        result = data;
        toast.success('Rule created successfully');
      }
      
      // Update rules state
      const updatedRule = {
        id: result.id,
        userId: result.user_id,
        name: result.name,
        pattern: result.pattern,
        patternType: result.pattern_type as 'vendor' | 'item' | 'description',
        categoryId: result.category_id,
        priority: result.priority,
        isActive: result.is_active,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        category: result.category
      };
      
      if (editingRule.id) {
        setRules(prev => prev.map(rule => rule.id === editingRule.id ? updatedRule : rule));
      } else {
        setRules(prev => [...prev, updatedRule]);
      }
      
      setEditingRule(null);
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Error saving rule');
    }
  };
  
  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('categorization_rules')
        .delete()
        .eq('id', ruleId);
        
      if (error) throw error;
      
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      toast.success('Rule deleted successfully');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Error deleting rule');
    }
  };
  
  const handleToggleActive = async (rule: CategorizationRule) => {
    try {
      const { error } = await supabase
        .from('categorization_rules')
        .update({ is_active: !rule.isActive })
        .eq('id', rule.id);
        
      if (error) throw error;
      
      setRules(prev => prev.map(r => {
        if (r.id === rule.id) {
          return {
            ...r,
            isActive: !r.isActive
          };
        }
        return r;
      }));
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast.error('Error updating rule');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingRule(null);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading categorization rules...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Category Rules</CardTitle>
        <CardDescription>
          Create rules to automatically categorize your receipts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rules.length === 0 && !editingRule ? (
          <div className="text-center py-6">
            <Info className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-2" />
            <p className="text-muted-foreground mb-4">
              You haven't created any categorization rules yet.
            </p>
            <Button onClick={handleAddRule}>Create Your First Rule</Button>
          </div>
        ) : (
          <>
            {/* Rules Table */}
            {!editingRule && rules.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Pattern</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{rule.patternType}</TableCell>
                        <TableCell>{rule.pattern}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: rule.category?.color || '#888' }}
                            />
                            {rule.category?.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={rule.isActive !== false}
                            onCheckedChange={() => handleToggleActive(rule)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRule(rule)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => rule.id && handleDeleteRule(rule.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Rule Editor */}
            {editingRule && (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-lg font-medium">
                  {isAddingRule ? 'Add New Rule' : 'Edit Rule'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rule Name</label>
                    <Input
                      value={editingRule.name}
                      onChange={(e) => setEditingRule({...editingRule, name: e.target.value})}
                      placeholder="e.g., Grocery Stores"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pattern Type</label>
                    <Select
                      value={editingRule.patternType}
                      onValueChange={(value) => setEditingRule({
                        ...editingRule, 
                        patternType: value as 'vendor' | 'item' | 'description'
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vendor">Vendor Name</SelectItem>
                        <SelectItem value="item">Item Description</SelectItem>
                        <SelectItem value="description">Expense Description</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pattern</label>
                  <Input
                    value={editingRule.pattern}
                    onChange={(e) => setEditingRule({...editingRule, pattern: e.target.value})}
                    placeholder={
                      editingRule.patternType === 'vendor' 
                        ? 'e.g., walmart' 
                        : editingRule.patternType === 'item'
                          ? 'e.g., bread'
                          : 'e.g., grocery'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    The text to match. This is case-insensitive and will match if the pattern is found anywhere.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={editingRule.categoryId}
                    onValueChange={(value) => setEditingRule({...editingRule, categoryId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center">
                            <span 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Input
                    type="number"
                    value={editingRule.priority || 0}
                    onChange={(e) => setEditingRule({
                      ...editingRule, 
                      priority: parseInt(e.target.value) || 0
                    })}
                    min={0}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher priority rules are checked first (0-100).
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="rule-active"
                    checked={editingRule.isActive !== false}
                    onCheckedChange={(checked) => setEditingRule({...editingRule, isActive: checked})}
                  />
                  <label htmlFor="rule-active" className="text-sm font-medium">
                    Rule is active
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {editingRule ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSaveRule}>
              <Save className="mr-2 h-4 w-4" />
              Save Rule
            </Button>
          </div>
        ) : (
          <>
            <div></div> {/* Empty div for flex justify-between */}
            <Button onClick={handleAddRule}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default CategoryRulesManager;
