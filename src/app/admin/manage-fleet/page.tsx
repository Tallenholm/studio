import { getFleetAssets, getNotifications } from '@/lib/firestoreService';
import FleetManagementClientPage from './FleetManagementClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function ManageFleetPage() {
    const [assets, notifications] = await Promise.all([
        getFleetAssets(),
        getNotifications(),
    ]);

    return (
        <Suspense fallback={<PageSkeleton />}>
            <FleetManagementClientPage
                initialAssets={assets}
                initialNotifications={notifications}
            />
        </Suspense>
    );
}
