
import AdminDashboardClientPage from '@/components/admin/AdminDashboardClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function AdminDashboardPage() {
    // Data is now fetched on the client side after authentication is confirmed.
    return (
        <Suspense fallback={<PageSkeleton variant="dashboard" />}>
            <AdminDashboardClientPage />
        </Suspense>
    );
}
