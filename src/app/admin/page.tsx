
import { getAdminDashboardData } from '@/app/actions/getAdminDashboardData';
import AdminDashboardClientPage from '@/components/admin/AdminDashboardClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default async function AdminDashboardPage() {
    const initialData = await getAdminDashboardData();

    return (
        <Suspense fallback={<PageSkeleton variant="dashboard" />}>
            <AdminDashboardClientPage
                initialData={initialData}
            />
        </Suspense>
    );
}
