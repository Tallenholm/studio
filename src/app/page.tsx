
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // The redirection logic is now fully handled by the main AppLayout component
    // to prevent race conditions and redirect loops. This page is now just a
    // loading fallback.
    if (!isLoading) {
      router.replace('/login');
    }
  }, [isLoading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
