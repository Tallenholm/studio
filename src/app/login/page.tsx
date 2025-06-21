
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tractor, LogIn, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, role, isLoading } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  // In a real app, this would be a proper auth flow.
  // For this project, we'll use hardcoded PINs.
  const EMPLOYEE_PIN = '1234';
  const MANAGER_PIN = '5678';

  useEffect(() => {
    if (!isLoading && role) {
      router.push(role === 'employee' ? '/employee' : '/');
    }
  }, [role, isLoading, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === EMPLOYEE_PIN) {
      toast({ title: 'Login Successful', description: 'Welcome, Employee!' });
      login('employee');
    } else if (pin === MANAGER_PIN) {
      toast({ title: 'Login Successful', description: 'Welcome, Manager!' });
      login('manager');
    } else {
      setError('Invalid PIN. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <Tractor className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl font-headline">Logans Excavating</CardTitle>
          <CardDescription>Please enter your PIN to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN Code</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="****"
                required
                className="text-center text-lg tracking-[0.5em]"
                aria-label="PIN Code"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}
            <Button type="submit" className="w-full text-lg py-6">
              <LogIn className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </form>
          <div className="mt-6 text-xs text-muted-foreground text-center">
            <p>Hint: Use PIN '1234' for Employee or '5678' for Manager.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
