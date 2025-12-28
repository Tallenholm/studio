'use client';

import { getAdminDashboardData } from '@/app/actions/getAdminDashboardData';
import AdminDashboardClientPage from '@/components/admin/AdminDashboardClientPage';
import { useEffect, useState } from 'react';
import type { AdminDashboardData } from '@/app/actions/getAdminDashboardData';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
    const [initialData, setInitialData] = useState<AdminDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAdminDashboardData()
            .then(data => {
                setInitialData(data);
            })
            .catch(error => {
                console.error("Failed to fetch admin dashboard data:", error);
                setInitialData(null); // Handle error case
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading Dashboard...</p>
            </div>
        );
    }
    
    return (
        <AdminDashboardClientPage
            initialData={initialData}
        />
    );
}
