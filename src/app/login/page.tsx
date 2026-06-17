
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, AlertCircle, Chrome, Truck, Loader2 } from 'lucide-react';
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
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden bg-[hsl(222,47%,6%)]">
      {/* Premium ambient background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 20% 40%, hsl(231 72% 60% / 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, hsl(262 80% 64% / 0.12) 0%, transparent 55%)',
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(210 40% 98%) 1px, transparent 1px), linear-gradient(90deg, hsl(210 40% 98%) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/25 backdrop-blur-sm">
              <Truck className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Logan's Excavating</h1>
          <p className="text-sm text-white/40 mt-1">Fleet & Operations Management</p>
        </div>

        {/* Login card */}
        <Card className="glass-card border-white/10 shadow-2xl shadow-black/40">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-white">Sign in to your account</CardTitle>
            <CardDescription className="text-white/50">Enter your credentials below to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {!isFirebaseConfigured ? (
              <div className="flex flex-col items-center justify-center gap-2 text-sm text-destructive p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-8 w-8" />
                <p className="font-semibold text-center">Firebase Not Configured</p>
                <p className="text-center text-xs opacity-80">Please add your project credentials to the .env file to enable login.</p>
              </div>
            ) : (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <fieldset disabled={isFormDisabled} className="space-y-4 disabled:opacity-60">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 text-xs font-medium">Email address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@company.com"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                            {...field}
                            aria-label="Email address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div>
                      <FormField control={loginForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/70 text-xs font-medium">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                              {...field}
                              aria-label="Password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="text-right mt-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="link" type="button" className="text-xs p-0 h-auto text-primary/70 hover:text-primary">Forgot password?</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reset your password</AlertDialogTitle>
                              <AlertDialogDescription>
                                Enter your email address to receive a password reset link.
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
                                aria-label="Password reset email"
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
                  {loginError && (
                    <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in-up">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <p>{loginError}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full font-medium shadow-glow" disabled={isFormDisabled}>
                    {isUserLoading || loginForm.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="mr-2 h-4 w-4" />
                    )}
                    Sign In
                  </Button>
                </form>
              </Form>
            )}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-transparent px-3 text-white/30">or</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20"
              onClick={handleGoogleSignIn}
              disabled={isFormDisabled}
            >
              {isUserLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
