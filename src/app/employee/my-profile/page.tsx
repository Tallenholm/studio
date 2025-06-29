
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { loadUsers, saveUsers } from '@/lib/localStorageService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Lock, Loader2 } from 'lucide-react';

const changePinSchema = z.object({
    currentPin: z.string().min(1, 'Current PIN is required.'),
    newPin: z.string().min(4, 'New PIN must be at least 4 digits.').max(8, 'New PIN must be 8 digits or less.'),
    confirmNewPin: z.string(),
}).refine(data => data.newPin === data.confirmNewPin, {
    message: "New PINs do not match.",
    path: ['confirmNewPin'],
});

export default function MyProfilePage() {
    const { user, login } = useAuth();
    const { toast } = useToast();
    const [isMounted, setIsMounted] = useState(false);

    const form = useForm<z.infer<typeof changePinSchema>>({
        resolver: zodResolver(changePinSchema),
        defaultValues: {
            currentPin: '',
            newPin: '',
            confirmNewPin: '',
        },
    });
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const onSubmit = (values: z.infer<typeof changePinSchema>) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
            return;
        }

        const allUsers = loadUsers();
        const currentUserInDb = allUsers.find(u => u.id === user.id);

        if (!currentUserInDb || currentUserInDb.pin !== values.currentPin) {
            form.setError('currentPin', { message: 'The current PIN is incorrect.' });
            return;
        }
        
        if (allUsers.some(u => u.pin === values.newPin && u.id !== user.id)) {
            form.setError('newPin', { message: 'This PIN is already in use by another account.' });
            return;
        }

        const updatedUsers = allUsers.map(u => 
            u.id === user.id ? { ...u, pin: values.newPin } : u
        );
        
        saveUsers(updatedUsers);
        
        const updatedUser = { ...currentUserInDb, pin: values.newPin };
        login(updatedUser); // Update session storage with new user data

        toast({ title: 'Success', description: 'Your PIN has been updated.' });
        form.reset();
    };

    if (!isMounted || !user) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading Profile...</p>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-8 space-y-8">
            <Card className="max-w-4xl mx-auto bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline flex items-center gap-2">
                        <UserIcon className="h-8 w-8 text-primary" />
                        My Profile
                    </CardTitle>
                    <CardDescription>View your personal information and manage account settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                        <h3 className="font-semibold">Account Details</h3>
                        <p><strong className="font-medium text-foreground">Name:</strong> {user.name}</p>
                        <p><strong className="font-medium text-foreground">Role:</strong> <span className="capitalize">{user.role}</span></p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Change Your PIN</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="currentPin"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Current PIN</FormLabel>
                                                    <FormControl><Input type="password" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="newPin"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>New PIN</FormLabel>
                                                    <FormControl><Input type="password" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="confirmNewPin"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Confirm New PIN</FormLabel>
                                                    <FormControl><Input type="password" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit">Update PIN</Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
