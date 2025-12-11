import { Loader2 } from 'lucide-react';

export default function RootPage() {
  // This page is intentionally left as a loading display.
  // The main AppLayout component handles all routing and redirection logic
  // to prevent race conditions and redirect loops.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
