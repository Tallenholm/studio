import { getFleetAssets, getMaintenanceLogs } from '@/lib/firestoreService';
import MaintenanceLogsClientPage from './MaintenanceLogsClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

export default async function MaintenanceLogsPage() {
    const [assets, logs] = await Promise.all([
        getFleetAssets(),
        getMaintenanceLogs(),
    ]);

    return (
        <Suspense fallback={<PageSkeleton />}>
            <MaintenanceLogsClientPage initialAssets={assets} initialLogs={logs} />
        </Suspense>
    );
}
