import { getPendingTimeOffRequests, getReviewedTimeOffRequests } from '@/lib/firestoreService';
import ManageRequestsClientPage from './ManageRequestsClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

export default async function ManageRequestsPage() {
    const [pending, reviewed] = await Promise.all([
        getPendingTimeOffRequests(),
        getReviewedTimeOffRequests(),
    ]);

    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <ManageRequestsClientPage initialPendingRequests={pending} initialReviewedRequests={reviewed} />
        </Suspense>
    );
}
