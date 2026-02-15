

'use client';

import { useState, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import PageSkeleton from '@/components/common/PageSkeleton';
import EmptyState from '@/components/common/EmptyState';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Users, Loader2, MoreHorizontal, KeyRound, Pencil, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getUsers, updateUser } from '@/lib/firestoreService';
import { useToast } from '@/hooks/use-toast';
import { useUser, useAuth } from '@/firebase/provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { user: currentUser } = useUser();
    const auth = useAuth();
    const [isSaving, setIsSaving] = useState<string | null>(null); // Store user ID being saved

    // State for setting hourly rate
    const [rateUser, setRateUser] = useState<User | null>(null);
    const [newRate, setNewRate] = useState('');

    useEffect(() => {
        async function fetchUsers() {
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

    const handleSetRate = async () => {
        if (!rateUser || newRate === '') return;
        const rate = parseFloat(newRate);
        if (isNaN(rate) || rate < 0) {
            toast({ variant: 'destructive', title: 'Invalid Rate', description: 'Please enter a valid positive number for the hourly rate.' });
            return;
        }

        setIsSaving(rateUser.id);
        try {
            await updateUser(rateUser.id, { hourlyRate: rate });
            setUsers(users.map(u => u.id === rateUser.id ? { ...u, hourlyRate: rate } : u));
            toast({ title: 'Hourly Rate Updated', description: `${rateUser.name}'s hourly rate has been set to $${rate.toFixed(2)}.` });
        } catch (error) {
            console.error('Rate change error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update hourly rate.' });
        } finally {
            setIsSaving(null);
            setRateUser(null);
            setNewRate('');
        }
    };

    const formatCurrency = (value: number | undefined) => {
        if (value === undefined || value === null) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    if (isLoading) {
        return <PageSkeleton />;
    }

    return (
        <>
            <div className="container mx-auto py-8">
                <PageHeader
                    title="Manage Employees"
                    description="View and manage employees, their roles, and account security."
                    icon={Users}
                />

                <div className="mt-8 animate-fade-in-up">
                    {users.length > 0 ? (
                        <div className="border rounded-md bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Hourly Rate</TableHead>
                                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>{getRoleLabel(user.role)}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{formatCurrency(user.hourlyRate)}</TableCell>
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
                                                                    <DropdownMenuSubTrigger disabled={currentUser?.id === user.id}>
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
                                                                <DropdownMenuItem onClick={() => setRateUser(user)}>
                                                                    <DollarSign className="mr-2 h-4 w-4" />
                                                                    Set Rate
                                                                </DropdownMenuItem>
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
                        <EmptyState
                            icon={Users}
                            title="No Other Employees"
                            message="As new users sign up, they will appear here with the 'Employee' role."
                        />
                    )}
                </div>
            </div>

            <AlertDialog open={!!rateUser} onOpenChange={(open) => {
                if (!open) {
                    setRateUser(null);
                    setNewRate('');
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Set Hourly Rate for {rateUser?.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter the new hourly rate for this employee. This will be used for job cost estimations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Label htmlFor="hourly-rate">Hourly Rate ($)</Label>
                        <Input
                            id="hourly-rate"
                            type="number"
                            placeholder="e.g., 25.50"
                            value={newRate}
                            onChange={(e) => setNewRate(e.target.value)}
                            defaultValue={rateUser?.hourlyRate}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSetRate}>Save Rate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

