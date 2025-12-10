
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase-initialize';

const { auth } = initializeFirebase();

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState<string | null>(null); // Store user ID being saved

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

  const handlePasswordReset = async (email: string, userId: string) => {
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service is not available.' });
        return;
    }
    setIsSaving(userId);
    try {
        await sendPasswordResetEmail(auth, email);
        toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${email} with reset instructions.` });
    } catch (error) {
        console.error('Password reset error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to send password reset email.' });
    } finally {
        setIsSaving(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    setIsSaving(userId);
    try {
        await updateUser(userId, { role: newRole });
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast({ title: 'Role Updated', description: `${userToUpdate.name}'s role has been changed to ${getRoleLabel(newRole)}.` });
    } catch (error) {
        console.error('Role change error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user role.' });
    } finally {
        setIsSaving(null);
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
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild disabled={currentUser?.role !== 'owner' || isSaving === user.id}>
                                                     <Button variant="ghost" className="h-auto p-1">
                                                        <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>{getRoleLabel(user.role)}</Badge>
                                                     </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'owner')} disabled={user.role === 'owner'}>Owner</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'manager')} disabled={user.role === 'manager'}>Manager</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'employee')} disabled={user.role === 'employee'}>Employee</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isSaving === user.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                            ) : (
                                            currentUser?.role === 'owner' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Actions</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            <span>Change Role</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
                                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'owner')} disabled={user.role === 'owner'}>Owner</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'manager')} disabled={user.role === 'manager'}>Manager</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'employee')} disabled={user.role === 'employee'}>Employee</DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handlePasswordReset(user.email, user.id)}>
                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                        Send Password Reset
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            )
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                          <Users className="h-12 w-12 mx-auto mb-4 text-primary/70" />
                          <h3 className="text-xl font-semibold text-foreground">No Other Employees</h3>
                          <p className="mt-2">As new users sign up, they will appear here with the 'Employee' role.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
