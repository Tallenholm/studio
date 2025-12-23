
import { getAdminDashboardData } from '@/app/actions/getAdminDashboardData';
import AdminDashboardClientPage from '@/components/admin/AdminDashboardClientPage';

// This is now a React Server Component (RSC)
export default async function AdminDashboardPage() {
    // Fetch data on the server using the server action.
    // The RouteGuard already ensures an authenticated user is present.
    const initialDashboardData = await getAdminDashboardData();

    // Pass the server-fetched data to the client component
    return (
        <AdminDashboardClientPage
            initialData={initialDashboardData}
        />
    );
}
