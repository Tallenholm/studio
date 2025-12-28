'use client';

import { getEmployeeDashboardData } from '@/app/actions/getEmployeeDashboardData';
import EmployeeHubClientPage from '@/components/employee/EmployeeHubClientPage';
import { useEffect, useState } from 'react';
import type { EmployeeDashboardData } from '@/app/actions/getEmployeeDashboardData';
import { Loader2 } from 'lucide-react';

export default function EmployeeHubPage() {
    const [initialData, setInitialData] = useState<EmployeeDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getEmployeeDashboardData()
            .then(data => {
                setInitialData(data);
            })
            .catch(error => {
                console.error("Failed to fetch employee dashboard data:", error);
                setInitialData(null);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    if (isLoading || !initialData) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading Hub...</p>
            </div>
        );
    }

    return (
        <EmployeeHubClientPage
            initialData={initialData}
        />
    );
}
