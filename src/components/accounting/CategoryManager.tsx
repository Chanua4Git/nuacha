
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';
import { CategoryFormData, CategoryWithChildren } from '@/types/accounting';
import { Loader2, Plus, Trash2, Edit, ChevronRight, ChevronDown, RefreshCw, Link as LinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/auth/contexts/AuthProvider';
import { ensureBudgetDefaults, seedRecommendedExpenseCategories, syncExpenseToBudgetCategories } from '@/utils/categorySync';
import { useCategorySync } from '@/hooks/useCategorySync';

interface CategoryManagerProps {
  familyId: string;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ familyId }) => {
  const { user } = useAuth();
  const {
    categories,
    hierarchicalCategories,
    budgetCategories,
    familyCategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory
  } = useUnifiedCategories({ 
    familyId, 
    mode: 'all' 
  });
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [seeding, setSeeding] = useState(false);
  const { syncCategoriesForFamily, isSyncing } = useCategorySync();

  const defaultFormData: CategoryFormData = {
    name: '',
    color: '#5A7684',
    familyId,
    parentId: undefined,
    budget: undefined,
    description: '',
    icon: '',
  };
  
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  
  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingCategory(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Process the parentId - convert "none" to null/undefined
      const processedFormData = {
        ...formData,
        parentId: formData.parentId === "none" ? null : formData.parentId
      };
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: processedFormData.name,
          color: processedFormData.color,
          parentId: processedFormData.parentId,
          budget: processedFormData.budget || null,
          description: processedFormData.description || null,
          icon: processedFormData.icon || null,
        });
      } else {
        await createCategory({
          name: processedFormData.name,
          color: processedFormData.color,
          familyId,
          parentId: processedFormData.parentId,
          budget: processedFormData.budget || null,
          description: processedFormData.description || null,
          icon: processedFormData.icon || null,
        });
      }
      
      resetForm();
      setFormOpen(false);
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };
  
  const handleEditCategory = (category: CategoryWithChildren) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      familyId: category.familyId,
      parentId: category.parentId || "none", // Convert null/undefined to "none"
      budget: category.budget,
      description: category.description || '',
      icon: category.icon || '',
    });
    setFormOpen(true);
  };
  
  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };
  
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  const countDescendants = (rootId: string) => {
    const byParent = new Map<string, string[]>();
    categories.forEach((c) => {
      if (c.parentId) {
        const arr = byParent.get(c.parentId) || [];
        arr.push(c.id);
        byParent.set(c.parentId, arr);
      }
    });
    let count = 0;
    const stack: string[] = [...(byParent.get(rootId) || [])];
    while (stack.length) {
      const current = stack.pop()!;
      count++;
      const children = byParent.get(current) || [];
      children.forEach((id) => stack.push(id));
    }
    return count;
  };
  
  const renderCategoryTree = (categories: CategoryWithChildren[], depth = 0, isSystemCategory = false) => {
    return categories.map(category => (
      <div key={category.id} className="mb-1">
        <div 
          className={`flex items-center p-2 rounded-md hover:bg-accent/50 ${
            depth > 0 ? 'ml-' + (depth * 4) : ''
          } ${isSystemCategory ? 'opacity-80' : ''}`}
        >
          {category.children && category.children.length > 0 ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 mr-1"
              onClick={() => toggleExpand(category.id)}
            >
              {expandedCategories[category.id] ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          ) : (
            <span className="w-6"></span>
          )}
          
          <div 
            className="flex-grow flex items-center"
          >
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: category.color }}
            />
            <span className={`${isSystemCategory ? 'text-muted-foreground' : ''}`}>
              {category.name}
            </span>
            {category.budget && (
              <span className="ml-2 text-xs text-muted-foreground">
                Budget: ${category.budget}
              </span>
            )}
            {isSystemCategory && (
              <span className="ml-2 text-xs text-muted-foreground italic">
                (System)
              </span>
            )}
          </div>
          
          {!isSystemCategory && (
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEditCategory(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Category</DialogTitle>
                  </DialogHeader>
                  <p>
                    Are you sure you want to delete the category "{category.name}"?
                    This action cannot be undone.
                  </p>
                  {(() => {
                    const subCount = countDescendants(category.id);
                    return subCount > 0 ? (
                      <p className="text-destructive">
                        This will also delete {subCount} subcategor{subCount === 1 ? 'y' : 'ies'}.
                      </p>
                    ) : null;
                  })()}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        Delete
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        
        {category.children && expandedCategories[category.id] && (
          <div>
            {renderCategoryTree(category.children, depth + 1, isSystemCategory)}
          </div>
        )}
      </div>
    ));
  };

  // Group categories by type matching CategorySelector structure
  const groupedHierarchicalCategories = useMemo(() => {
    const grouped = {
      needs: [] as CategoryWithChildren[],
      wants: [] as CategoryWithChildren[],
      savings: [] as CategoryWithChildren[],
      other: [] as CategoryWithChildren[]
    };
    
    hierarchicalCategories.forEach(category => {
      const groupType = category.groupType as 'needs' | 'wants' | 'savings';
      
      if (groupType === 'needs') {
        grouped.needs.push(category);
      } else if (groupType === 'wants') {
        grouped.wants.push(category);
      } else if (groupType === 'savings') {
        grouped.savings.push(category);
      } else {
        grouped.other.push(category);
      }
    });
    
    // Sort each group alphabetically
    Object.values(grouped).forEach(group => {
      group.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return grouped;
  }, [hierarchicalCategories]);

  const renderCategorySection = (title: string, categories: CategoryWithChildren[], colorClass: string, isSystemSection = false) => {
    if (categories.length === 0) return null;
    
    return (
      <div className="mb-6">
        {/* Section Header matching CategorySelector style */}
        <div className={`px-3 py-2 text-sm font-semibold border rounded-t-md ${colorClass}`}>
          {title}
        </div>
        
        {/* Categories */}
        <div className="border border-t-0 rounded-b-md">
          {categories.map(category => {
            if (category.children && category.children.length > 0) {
              // Parent category with children
              return (
                <div key={category.id}>
                  {/* Parent Category Header */}
                  <div 
                    className="px-3 py-2 text-sm font-medium bg-muted/20 border-l-4 border-b flex items-center justify-between" 
                    style={{ borderLeftColor: category.color }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                      {category.budget && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Budget: ${category.budget}
                        </span>
                      )}
                      {isSystemSection && (
                        <span className="ml-2 text-xs text-muted-foreground italic">
                          (System)
                        </span>
                      )}
                    </div>
                    
                    {!isSystemSection && (
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => toggleExpand(category.id)}
                        >
                          {expandedCategories[category.id] ? 
                            <ChevronDown className="h-3 w-3" /> : 
                            <ChevronRight className="h-3 w-3" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Child Categories */}
                  <div>
                    {category.children
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((child, childIndex) => (
                        <div 
                          key={`${child.id}-${childIndex}`}
                          className={`flex items-center justify-between px-6 py-2 border-b last:border-b-0 hover:bg-accent/50 ${
                            isSystemSection ? 'opacity-80' : ''
                          }`}
                        >
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: child.color }}
                            />
                            <span className={`${isSystemSection ? 'text-muted-foreground' : ''}`}>
                              {child.name}
                            </span>
                            {child.budget && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                Budget: ${child.budget}
                              </span>
                            )}
                            {isSystemSection && (
                              <span className="ml-2 text-xs text-muted-foreground italic">
                                (System)
                              </span>
                            )}
                          </div>
                          
                          {!isSystemSection && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditCategory(child)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Category</DialogTitle>
                                  </DialogHeader>
                                  <p>
                                    Are you sure you want to delete the category "{child.name}"?
                                    This action cannot be undone.
                                  </p>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleDeleteCategory(child.id)}
                                      >
                                        Delete
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            } else {
              // Standalone category without children
              return (
                <div 
                  key={category.id}
                  className={`flex items-center justify-between px-4 py-2 border-b last:border-b-0 hover:bg-accent/50 ${
                    isSystemSection ? 'opacity-80' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className={`${isSystemSection ? 'text-muted-foreground' : ''}`}>
                      {category.name}
                    </span>
                    {category.budget && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Budget: ${category.budget}
                      </span>
                    )}
                    {isSystemSection && (
                      <span className="ml-2 text-xs text-muted-foreground italic">
                        (System)
                      </span>
                    )}
                  </div>
                  
                  {!isSystemSection && (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Category</DialogTitle>
                          </DialogHeader>
                          <p>
                            Are you sure you want to delete the category "{category.name}"?
                            This action cannot be undone.
                          </p>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                Delete
                              </Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Please log in to manage your expense categories.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Filter out categories with empty IDs to prevent errors
  const validCategories = categories.filter(c => c.id && c.id !== '');
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            System categories (Needs, Wants, Savings) and your family-specific categories
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncCategoriesForFamily(familyId)}
            disabled={isSyncing}
            aria-label="Sync categories with new 12-category structure"
          >
            {isSyncing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LinkIcon className="mr-2 h-4 w-4" />
            )}
            Sync Categories
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                setSeeding(true);
                await seedRecommendedExpenseCategories(familyId);
                toast.success('Added recommended categories');
              } catch (e) {
                console.error(e);
                toast.error('Could not add recommended categories');
              } finally {
                setSeeding(false);
              }
            }}
            disabled={seeding}
          >
            {seeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add recommended
          </Button>
          <Button onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hierarchicalCategories.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <p>No categories yet. Sync system categories to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderCategorySection(
              "NEEDS (Essential)", 
              groupedHierarchicalCategories.needs, 
              "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800", 
              true
            )}
            
            {renderCategorySection(
              "WANTS (Discretionary)", 
              groupedHierarchicalCategories.wants, 
              "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800", 
              true
            )}
            
            {renderCategorySection(
              "SAVINGS & INVESTMENTS", 
              groupedHierarchicalCategories.savings, 
              "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800", 
              true
            )}
            
            {renderCategorySection(
              "OTHER", 
              groupedHierarchicalCategories.other, 
              "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800", 
              false
            )}
          </div>
        )}
      </CardContent>
      
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="color" className="text-right text-sm font-medium">
                  Color
                </label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-12 h-9 p-1"
                  />
                  <span className="text-sm text-muted-foreground">{formData.color}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="parent" className="text-right text-sm font-medium">
                  Parent Category
                </label>
                <Select
                  value={formData.parentId || "none"}
                  onValueChange={(value) => setFormData({...formData, parentId: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {validCategories
                      .filter(c => c.id !== editingCategory?.id)
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="budget" className="text-right text-sm font-medium">
                  Budget
                </label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget || ''}
                  onChange={(e) => setFormData({
                    ...formData, 
                    budget: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="icon" className="text-right text-sm font-medium">
                  Icon
                </label>
                <Input
                  id="icon"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({...formData, icon: e.target.value})}
                  className="col-span-3"
                  placeholder="Optional: icon name"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <label htmlFor="description" className="text-right text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Optional description"
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CategoryManager;
