import { useState } from 'react';
import { useFamilies } from '@/hooks/useFamilies';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Family } from '@/types/expense';
import FamilyFormDialog from './FamilyFormDialog';

const FamiliesManager = () => {
  const { families, isLoading, deleteFamily } = useFamilies();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | undefined>();
  const [deletingFamily, setDeletingFamily] = useState<Family | null>(null);
  const [relatedCounts, setRelatedCounts] = useState<{
    expenses: number;
    members: number;
    categories: number;
    reminders: number;
    budgets: number;
  } | null>(null);

  const handleEdit = (family: Family) => {
    setEditingFamily(family);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingFamily(undefined);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (family: Family) => {
    setDeletingFamily(family);
    
    // Fetch counts of related data
    const [expenses, members, categories, reminders, budgets] = await Promise.all([
      supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('family_id', family.id),
      supabase.from('family_members').select('id', { count: 'exact', head: true }).eq('family_id', family.id),
      supabase.from('categories').select('id', { count: 'exact', head: true }).eq('family_id', family.id),
      supabase.from('reminders').select('id', { count: 'exact', head: true }).eq('family_id', family.id),
      supabase.from('budgets').select('id', { count: 'exact', head: true }).eq('family_id', family.id),
    ]);

    setRelatedCounts({
      expenses: expenses.count || 0,
      members: members.count || 0,
      categories: categories.count || 0,
      reminders: reminders.count || 0,
      budgets: budgets.count || 0,
    });
  };

  const handleDelete = async () => {
    if (deletingFamily) {
      await deleteFamily(deletingFamily.id);
      setDeletingFamily(null);
      setRelatedCounts(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingFamily(undefined);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Families</CardTitle>
          <CardDescription>Manage your family profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Families</CardTitle>
            <CardDescription>Manage your family profiles</CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Family
          </Button>
        </CardHeader>
        <CardContent>
          {families.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No families yet. Let's create your first family.</p>
              <Button onClick={handleAdd} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Family
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-24">Color</TableHead>
                    <TableHead className="text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {families.map((family) => (
                    <TableRow key={family.id}>
                      <TableCell className="font-medium">{family.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border border-border"
                            style={{ backgroundColor: family.color }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(family)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(family)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FamilyFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        family={editingFamily}
      />

      <AlertDialog open={!!deletingFamily} onOpenChange={(open) => {
        if (!open) {
          setDeletingFamily(null);
          setRelatedCounts(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>This will permanently delete the family "{deletingFamily?.name}" and all associated data:</p>
                
                {relatedCounts && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {relatedCounts.expenses > 0 && (
                      <li>• {relatedCounts.expenses} expense{relatedCounts.expenses !== 1 ? 's' : ''}</li>
                    )}
                    {relatedCounts.members > 0 && (
                      <li>• {relatedCounts.members} family member{relatedCounts.members !== 1 ? 's' : ''}</li>
                    )}
                    {relatedCounts.categories > 0 && (
                      <li>• {relatedCounts.categories} categor{relatedCounts.categories !== 1 ? 'ies' : 'y'}</li>
                    )}
                    {relatedCounts.reminders > 0 && (
                      <li>• {relatedCounts.reminders} reminder{relatedCounts.reminders !== 1 ? 's' : ''}</li>
                    )}
                    {relatedCounts.budgets > 0 && (
                      <li>• {relatedCounts.budgets} budget entr{relatedCounts.budgets !== 1 ? 'ies' : 'y'}</li>
                    )}
                  </ul>
                )}
                
                <p className="mt-3 font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FamiliesManager;
