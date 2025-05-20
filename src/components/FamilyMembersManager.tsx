
import { useState } from 'react';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useExpense } from '@/context/ExpenseContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FamilyMember } from '@/types/expense';
import { Plus, Pencil, Trash2, Calendar, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import FamilyMemberFormDialog from './FamilyMemberFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const FamilyMembersManager = () => {
  const { selectedFamily } = useExpense();
  const { members, isLoading, deleteMember } = useFamilyMembers(selectedFamily?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | undefined>(undefined);
  const [deletingMember, setDeletingMember] = useState<FamilyMember | undefined>(undefined);

  if (!selectedFamily) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
          <CardDescription>Please select a family first</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingMember(undefined);
    setDialogOpen(true);
  };

  const handleDelete = (member: FamilyMember) => {
    setDeletingMember(member);
  };

  const confirmDelete = async () => {
    if (deletingMember) {
      await deleteMember(deletingMember.id);
      setDeletingMember(undefined);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Family Members</CardTitle>
          <CardDescription>Loading members...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Family Members</CardTitle>
          <CardDescription>Manage members of {selectedFamily.name}</CardDescription>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No family members yet.</p>
            <p className="text-sm mt-1">Add family members to track expenses for specific individuals.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {member.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.dateOfBirth ? (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {format(new Date(member.dateOfBirth), 'MMM d, yyyy')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {member.notes && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{member.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(member)}
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

      {/* Add/Edit Dialog */}
      {selectedFamily && (
        <FamilyMemberFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          familyId={selectedFamily.id}
          member={editingMember}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deletingMember} 
        onOpenChange={(open) => !open && setDeletingMember(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deletingMember?.name} from your family. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default FamilyMembersManager;
