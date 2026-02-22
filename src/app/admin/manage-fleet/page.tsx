
import { getFleetAssets } from '@/lib/firestoreService';
import FleetManagementClientPage from './FleetManagementClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function ManageFleetPage() {
    const assets = await getFleetAssets();

    return (
        <Suspense fallback={<PageSkeleton />}>
            <FleetManagementClientPage
                initialAssets={assets}
            />
        </Suspense>
    );
}
