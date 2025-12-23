
import { getAdminDashboardData } from '@/app/actions/getAdminDashboardData';
import { useUser } from '@/firebase/provider';
import AdminDashboardClientPage from '@/components/admin/AdminDashboardClientPage';
import { Loader2 } from 'lucide-react';

// This is now a React Server Component (RSC)
export default async function AdminDashboardPage() {
    const { user } = useUser();
    
    if (!user) {
         return (
          <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Authenticating user...</p>
          </div>
        );
    }
    
    // Fetch data on the server using the server action
    const initialDashboardData = await getAdminDashboardData();

    // Pass the server-fetched data to the client component
    return (
        <AdminDashboardClientPage
            initialData={initialDashboardData}
        />
    );
}
