import { getInventory, getUsers, getJobs, getFleetAssets } from '@/lib/firestoreService';
import InventoryClientPage from '@/components/admin/InventoryClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function ManageInventoryPage() {
    // Fetch all data on the server in parallel for maximum performance
    const [
        initialInventory,
        initialUsers,
        initialJobs,
        initialFleetAssets
    ] = await Promise.all([
        getInventory(),
        getUsers(),
        getJobs(),
        getFleetAssets(),
    ]);

    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <InventoryClientPage 
                initialInventory={initialInventory}
                initialUsers={initialUsers}
                initialJobs={initialJobs}
                initialFleetAssets={initialFleetAssets}
            />
        </Suspense>
    );
}
