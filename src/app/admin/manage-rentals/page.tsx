import { getFleetAssets, getRentals } from '@/lib/firestoreService';
import ManageRentalsClientPage from './ManageRentalsClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function ManageRentalsPage() {
    const [assets, rentals] = await Promise.all([
        getFleetAssets(),
        getRentals()
    ]);

    return (
        <Suspense fallback={<PageSkeleton />}>
            <ManageRentalsClientPage initialAssets={assets} initialRentals={rentals} />
        </Suspense>
    );
}
