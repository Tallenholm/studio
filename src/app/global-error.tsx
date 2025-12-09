'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-lg bg-card/90 backdrop-blur-xl border border-destructive/50 shadow-2xl text-center">
                <CardHeader>
                    <div className="mx-auto bg-destructive/20 rounded-full p-4 w-fit">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-headline pt-4">Application Error</CardTitle>
                    <CardDescription>
                        An unexpected error has occurred.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-md border text-left text-sm text-muted-foreground overflow-auto max-h-40">
                        <p><strong>Error:</strong> {error.name}</p>
                        <pre className="whitespace-pre-wrap font-mono text-xs mt-2">{error.message}</pre>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        You can try to recover from this error by clicking the button below. If the problem persists, please contact support.
                    </p>
                    <Button onClick={() => reset()} size="lg">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        </div>
      </body>
    </html>
  );
}
