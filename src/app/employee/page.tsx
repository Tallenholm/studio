
import EmployeeHubClientPage from '@/components/employee/EmployeeHubClientPage';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default async function EmployeeHubPage() {
    // Data fetching is now handled by the client component.
    return (
        <Suspense fallback={
             <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading Hub...</p>
            </div>
        }>
            <EmployeeHubClientPage />
        </Suspense>
    );
}
