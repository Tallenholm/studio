
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, AlertCircle, Chrome, UserPlus, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { sendPasswordResetEmail } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase-initialize';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const { auth } = initializeFirebase();

export default function LoginPage() {
  const { login, signUp, signInWithGoogle, isLoading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('signin');
  const [resetEmail, setResetEmail] = useState('');

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values.email, values.password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
    } catch (error: any) {
      loginForm.setError('root', { message: error.message || 'An unknown login error occurred.' });
    }
  };

  const onSignupSubmit = async (values: z.infer<typeof signupSchema>) => {
    try {
      await signUp(values.email, values.password);
      toast({ title: 'Account Created', description: 'Welcome! You have been signed in.' });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
          signupForm.setError('root', { message: 'This email is already in use. Please sign in or reset your password.' });
      } else {
        signupForm.setError('root', { message: error.message || 'An unknown sign-up error occurred.' });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
        await signInWithGoogle();
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
  
  const isFormDisabled = !isFirebaseConfigured || loginForm.formState.isSubmitting || signupForm.formState.isSubmitting || isLoading;
  const loginError = loginForm.formState.errors.root?.message;
  const signupError = signupForm.formState.errors.root?.message;
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm bg-card/90 backdrop-blur-xl border border-white/10 shadow-2xl">
        <CardHeader className="text-center items-center">
          <CardTitle className="text-3xl font-headline">Logan's Excavating</CardTitle>
          <CardDescription>Please sign in or create an account</CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseConfigured ? (
              <div className="flex flex-col items-center justify-center gap-2 text-sm text-destructive p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                <AlertCircle className="h-8 w-8" />
                <p className="font-bold text-center">Firebase Not Configured</p>
                <p className="text-center text-xs">Please add your project credentials to the .env file to enable login.</p>
              </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="space-y-4">
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
                 <div className="relative my-6"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div></div>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isFormDisabled}><Chrome className="mr-2 h-5 w-5" /> Sign In with Google</Button>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4 pt-4">
                        <fieldset disabled={isFormDisabled} className="space-y-4">
                        <FormField control={signupForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="name@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={signupForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="At least 6 characters" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        </fieldset>
                        {signupError && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" /><p>{signupError}</p></div>}
                        <Button type="submit" className="w-full" disabled={isFormDisabled}><UserPlus className="mr-2 h-5 w-5" /> Create Account</Button>
                    </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
