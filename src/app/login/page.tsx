
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, AlertCircle, Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function LoginPage() {
  const { login, signInWithGoogle, isLoading, isFirebaseConfigured } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (!isFirebaseConfigured) return;

    try {
      await login(values.email, values.password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
    } catch (error: any) {
      // The error message from the context is already user-friendly.
      form.setError('root', { message: error.message || 'An unknown login error occurred.' });
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) return;
    try {
        await signInWithGoogle();
        toast({ title: 'Login Successful', description: 'Welcome!' });
    } catch (error: any) {
        form.setError('root', { message: error.message || 'An unknown login error occurred.' });
    }
  };
  
  const isFormDisabled = !isFirebaseConfigured || form.formState.isSubmitting || isLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm bg-card/90 backdrop-blur-xl border border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-headline font-bold text-primary">Logan's Excavating</h1>
          <CardDescription>Please sign in to access the portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <fieldset disabled={isFormDisabled} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </fieldset>
              
              {form.formState.errors.root && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p>{form.formState.errors.root.message}</p>
                </div>
              )}

              {!isFirebaseConfigured && (
                  <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 border border-destructive/50 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <p>Firebase is not configured. Please add project credentials to the .env file to enable login.</p>
                  </div>
              )}

              <Button type="submit" className="w-full" disabled={isFormDisabled}>
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
          </div>

          <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isFormDisabled}
          >
              <Chrome className="mr-2 h-5 w-5" />
              Sign In with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    