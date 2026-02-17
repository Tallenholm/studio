import { getOpenWorkOrders, getCompletedWorkOrders } from '@/lib/firestoreService';
import ManageWorkOrdersClientPage from './ManageWorkOrdersClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

export default async function ManageWorkOrdersPage() {
    const [openOrders, completedOrders] = await Promise.all([
        getOpenWorkOrders(),
        getCompletedWorkOrders()
    ]);

    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <ManageWorkOrdersClientPage
                initialOpenOrders={openOrders}
                initialCompletedOrders={completedOrders}
            />
        </Suspense>
    );
}
