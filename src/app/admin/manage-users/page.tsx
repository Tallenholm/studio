
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
import { PlusCircle, Trash2, Users, Loader2, Pencil, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    setIsMounted(true);
    setUsers(loadUsers().sort((a, b) => a.name.localeCompare(b.name)));
  }, []);
  
  const getRoleLabel = (role: UserRole) => {
    if (!role) return 'Guest';
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
                View employees and their roles. User creation and password management are handled in the Firebase Console.
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell><Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>{getRoleLabel(user.role)}</Badge></TableCell>
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
