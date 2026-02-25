'use client';

import { useState, useMemo } from 'react';
import type { User, UserRole } from '@/lib/types';
import { getFirestoreInstance } from '@/lib/firestoreService';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import PageHeader from '@/components/common/PageHeader';
import { Users, Mail, MoreHorizontal, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface UserManagementClientPageProps {
  initialUsers: User[];
}

export default function UserManagementClientPage({ initialUsers }: UserManagementClientPageProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const auth = useAuth();

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (currentUser?.role !== 'owner') {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Only the owner can change user roles.' });
      return;
    }
    if (userId === currentUser.id && newRole !== 'owner') {
      toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'You cannot demote your own account.' });
      return;
    }
    
    try {
        const db = getFirestoreInstance();
        const userDocRef = doc(db, 'users', userId);
        const adminDocRef = doc(db, 'admins', userId);
        
        const batch = writeBatch(db);

        // 1. Update the role in the /users/{userId} document
        batch.update(userDocRef, { role: newRole });

        // 2. Synchronize the /admins collection
        if (newRole === 'owner' || newRole === 'manager') {
          // If user is promoted to an admin role, create/update their document in /admins
          batch.set(adminDocRef, { role: newRole });
        } else {
          // If user is demoted from an admin role, delete their document from /admins
          batch.delete(adminDocRef);
        }
        
        await batch.commit();

        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
        toast({ title: 'Role Updated', description: `User role has been changed to ${newRole}.` });

    } catch (error) {
        console.error("Failed to update user role:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update user role due to a database error.' });
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!auth) {
        toast({ variant: 'destructive', title: 'Auth service not available' });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${email} with instructions.` });
    } catch (error) {
        console.error('Password reset error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to send password reset email.' });
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'default';
      case 'manager': return 'secondary';
      case 'employee': return 'outline';
      default: return 'outline';
    }
  }

  return (
    <div className="container mx-auto py-8">
      <PageHeader
        title="Manage Employees"
        description="View and manage user roles and account settings."
        icon={Users}
      />
      <div className="mt-8 animate-fade-in-up space-y-4">
        <Card>
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
        </Card>
        
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {currentUser?.role === 'owner' ? (
                      <Select value={user.role} onValueChange={(newRole: UserRole) => handleRoleChange(user.id, newRole)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">{user.role}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions for {user.name}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handlePasswordReset(user.email)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Password Reset
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
