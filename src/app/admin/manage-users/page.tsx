
'use client';

import { useState, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Loader2, MoreHorizontal, KeyRound, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getUsers, updateUser } from '@/lib/firestoreService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase-initialize';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const { auth } = initializeFirebase();

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const loadedUsers = await getUsers();
            setUsers(loadedUsers.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
        } finally {
            setIsLoading(false);
        }
    };
    fetchUsers();
  }, [toast]);
  
  const getRoleLabel = (role: UserRole) => {
    if (!role) return 'Guest';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  const handlePasswordReset = async (email: string) => {
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service is not available.' });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${email} with reset instructions.` });
    } catch (error) {
        console.error('Password reset error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to send password reset email.' });
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!editingUser) return;
    
    setIsSaving(true);
    try {
        await updateUser(editingUser.id, { role: newRole });
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u));
        toast({ title: 'Role Updated', description: `${editingUser.name}'s role has been changed to ${newRole}.` });
        setEditingUser(null);
    } catch (error) {
        console.error('Role change error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user role.' });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading User Data...</p>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Manage Employees
              </CardTitle>
              <CardDescription className="mt-2">
                View and manage employees, their roles, and account security.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Card>
                <CardHeader>
                    <CardTitle>Employee List</CardTitle>
                </CardHeader>
                <CardContent>
                    {users.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Employee Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell><Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>{getRoleLabel(user.role)}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {currentUser?.role === 'owner' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Change Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handlePasswordReset(user.email)}>
                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                        Send Password Reset
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No employees added yet.</div>
                    )}
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
    
    <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Change Role for {editingUser?.name}</DialogTitle>
                <DialogDescription>
                    Select a new role for this user. This will change their permissions across the application.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select defaultValue={editingUser?.role} onValueChange={(value) => handleRoleChange(value as UserRole)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <DialogFooter>
                <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
