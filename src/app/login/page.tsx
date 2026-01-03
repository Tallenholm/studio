'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, AlertCircle, Chrome, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { isFirebaseConfigured, useAuth, useUser } from '@/firebase';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function LoginPage() {
  const { isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const [resetEmail, setResetEmail] = useState('');

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    if (!auth) return;
    initiateEmailSignIn(auth, values.email, values.password);
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        toast({ title: 'Login Successful', description: 'Welcome!' });
    } catch (error: any) {
        loginForm.setError('root', { message: error.message || 'An unknown login error occurred.' });
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter your email address.' });
        return;
    }
    if (!auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Authentication service is not available.' });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({ title: 'Password Reset Email Sent', description: `An email has been sent to ${resetEmail} with reset instructions.` });
    } catch (error) {
        console.error('Password reset error:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to send password reset email. Please ensure the email is correct.' });
    }
  };
  
  const isFormDisabled = !isFirebaseConfigured || loginForm.formState.isSubmitting || isUserLoading;
  const loginError = loginForm.formState.errors.root?.message;
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center items-center">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-full mb-2">
                <Truck className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-3xl font-headline">Logan's Excavating</CardTitle>
          <CardDescription>Fleet & Operations Management</CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseConfigured ? (
              <div className="flex flex-col items-center justify-center gap-2 text-sm text-destructive p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                <AlertCircle className="h-8 w-8" />
                <p className="font-bold text-center">Firebase Not Configured</p>
                <p className="text-center text-xs">Please add your project credentials to the .env file to enable login.</p>
              </div>
          ) : (
             <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 pt-4">
                    <fieldset disabled={isFormDisabled} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="name@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                     <div>
                        <FormField control={loginForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="text-right mt-2">
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="link" type="button" className="text-xs p-0 h-auto">Forgot Password?</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Your Password</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Enter your email address below to receive a password reset link.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-2">
                                    <Label htmlFor="reset-email" className="sr-only">Email</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handlePasswordReset}>Send Reset Link</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                     </div>
                    </fieldset>
                    {loginError && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" /><p>{loginError}</p></div>}
                    <Button type="submit" className="w-full" disabled={isFormDisabled}><LogIn className="mr-2 h-5 w-5" /> Sign In</Button>
                </form>
            </Form>
          )}
           <div className="relative my-6"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div></div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isFormDisabled}><Chrome className="mr-2 h-5 w-5" /> Sign In with Google</Button>
        </CardContent>
      </Card>
    </div>
  );
}
