
import EmployeeHubClientPage from '@/components/employee/EmployeeHubClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default function EmployeeHubPage() {
    // Data fetching is now handled by the client component.
    return (
        <Suspense fallback={<PageSkeleton variant="dashboard" />}>
            <EmployeeHubClientPage />
        </Suspense>
    );
}
