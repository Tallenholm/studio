
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadUsers, saveUsers } from '@/lib/localStorageService';
import type { User } from '@/lib/types';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Users, Loader2 } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(1, 'Employee name is required.'),
  pin: z.string().min(4, 'PIN must be at least 4 digits.').max(8, 'PIN must be 8 digits or less.'),
});

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      pin: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setUsers(loadUsers());
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveUsers(users);
    }
  }, [users, isMounted]);

  function onSubmit(values: z.infer<typeof userSchema>) {
    if (users.some(u => u.pin === values.pin)) {
        form.setError("pin", { message: "This PIN is already in use." });
        return;
    }

    const newUser: User = {
      id: `${Date.now()}`,
      ...values,
    };
    setUsers((prev) => [...prev, newUser].sort((a,b) => a.name.localeCompare(b.name)));
    toast({ title: 'User Added', description: `Employee ${values.name} has been added.` });
    setIsDialogOpen(false);
    form.reset();
  }

  function removeUser(userId: string) {
    const userToRemove = users.find(u => u.id === userId);
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    toast({
      title: 'User Removed',
      description: `Employee ${userToRemove?.name} has been removed.`,
      variant: 'destructive',
    });
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
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Manage Employees
              </CardTitle>
              <CardDescription className="mt-2">
                Add, view, and remove employee accounts and their login PINs.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Create a new employee account with a name and a unique PIN.
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
                    <DialogFooter>
                      <Button type="submit">Save Employee</Button>
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
                                    <TableHead>PIN</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>••••</TableCell>
                                        <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => removeUser(user.id)} aria-label={`Remove ${user.name}`}>
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
