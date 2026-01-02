
import { getAdminDashboardData } from '@/app/actions/getAdminDashboardData';
import AdminDashboardClientPage from '@/components/admin/AdminDashboardClientPage';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default async function AdminDashboardPage() {
    const initialData = await getAdminDashboardData();
    
    return (
        <Suspense fallback={
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading Dashboard...</p>
            </div>
        }>
            <AdminDashboardClientPage
                initialData={initialData}
            />
        </Suspense>
    );
}
