'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadUsers, saveUsers } from '@/lib/localStorageService';
import type { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Users, Loader2, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const userSchema = z.object({
  name: z.string().min(1, 'Employee name is required.'),
  pin: z.string().min(4, 'PIN must be at least 4 digits.').max(8, 'PIN must be 8 digits or less.'),
  role: z.enum(['owner', 'manager', 'employee'], { required_error: 'Role is required.' }),
});

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      pin: '',
      role: 'employee',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setUsers(loadUsers().sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      form.reset({ name: '', pin: '', role: 'employee' });
      setEditingUser(null);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      pin: user.pin,
      role: user.role,
    });
    setIsDialogOpen(true);
  };

  function onSubmit(values: z.infer<typeof userSchema>) {
    if (editingUser) {
      // Logic for editing a user
      if (users.some(u => u.pin === values.pin && u.id !== editingUser.id)) {
        form.setError("pin", { message: "This PIN is already in use." });
        return;
      }
      
      const ownersCount = users.filter(u => u.role === 'owner').length;
      if (editingUser.role === 'owner' && values.role !== 'owner' && ownersCount <= 1) {
        toast({ variant: 'destructive', title: 'Action Prohibited', description: 'Cannot demote the last owner.' });
        return;
      }

      const updatedUsers = users.map(u => 
        u.id === editingUser.id ? { ...u, ...values } : u
      );
      setUsers(updatedUsers.sort((a,b) => a.name.localeCompare(b.name)));
      saveUsers(updatedUsers);
      toast({ title: 'User Updated', description: `User "${values.name}" has been updated.` });
    } else {
      // Logic for adding a new user
      if (users.some(u => u.pin === values.pin)) {
        form.setError("pin", { message: "This PIN is already in use." });
        return;
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        ...values,
      };
      const newUsers = [...users, newUser].sort((a,b) => a.name.localeCompare(b.name));
      setUsers(newUsers);
      saveUsers(newUsers);
      toast({ title: 'User Added', description: `Employee ${values.name} has been added.` });
    }
    
    handleDialogOpenChange(false);
  }

  function removeUser(userId: string) {
    const userToRemove = users.find(u => u.id === userId);
    if (!userToRemove) return;

    if (userToRemove.role === 'owner' && users.filter(u => u.role === 'owner').length <= 1) {
      toast({ variant: 'destructive', title: 'Action Prohibited', description: 'Cannot delete the last owner.' });
      return;
    }
    
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    saveUsers(users.filter((user) => user.id !== userId));
    toast({
      title: 'User Removed',
      description: `Employee ${userToRemove.name} has been removed.`,
      variant: 'destructive',
    });
  }
  
  const getRoleLabel = (role: UserRole) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
  
  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading User Data...</p>
      </div>
    );
  }

  return (
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
                Add, view, and manage employee accounts, PINs, and roles.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? 'Update the details for this employee.' : 'Create a new employee account.'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login PIN</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter a 4-8 digit PIN" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={currentUser?.role !== 'owner' && (field.value === 'owner' || editingUser?.role === 'owner')}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="owner" disabled={currentUser?.role !== 'owner'}>Owner</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
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
                                    <TableHead>Role</TableHead>
                                    <TableHead>PIN</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell><Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>{getRoleLabel(user.role)}</Badge></TableCell>
                                        <TableCell>••••</TableCell>
                                        <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(user)} aria-label={`Edit ${user.name}`}>
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button variant="ghost" size="icon" onClick={() => removeUser(user.id)} aria-label={`Remove ${user.name}`} disabled={currentUser?.id === user.id}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
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
  );
}