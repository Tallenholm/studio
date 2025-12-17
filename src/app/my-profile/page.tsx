

'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Lock, Loader2, Send } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function MyProfilePage() {
    const { user } = useUser();
    const auth = useAuth();
    const { toast } = useToast();
    const [isMounted, setIsMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handlePasswordReset = async () => {
        if (!user || !user.email || !auth) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send reset email. User not found or not logged in.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({
                title: 'Password Reset Email Sent',
                description: `An email has been sent to ${user.email} with instructions to reset your password.`,
            });
        } catch (error) {
            console.error("Password reset error:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to send password reset email. Please try again later.'
            });
        } finally {
            setIsSubmitting(false);
        }
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
                        <p><strong className="font-medium text-foreground">Email:</strong> {user.email}</p>
                        <p><strong className="font-medium text-foreground">Role:</strong> <span className="capitalize">{user.role}</span></p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Change Your Password</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground mb-4">Click the button below to send a password reset link to your registered email address.</p>
                            <Button onClick={handlePasswordReset} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {isSubmitting ? 'Sending...' : 'Send Password Reset Email'}
                            </Button>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}
