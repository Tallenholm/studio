import { getTimeOffRequestsForUser } from '@/lib/firestoreService';
import TimeOffClientPage from './TimeOffClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';
import { cookies } from 'next/headers';

const getUserId = (): string | null => {
    return cookies().get('user_id')?.value || null;
}

export default async function TimeOffPage() {
    const userId = getUserId();
    const initialRequests = userId ? await getTimeOffRequestsForUser(userId) : [];
    const sortedRequests = initialRequests.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <TimeOffClientPage initialRequests={sortedRequests} />
        </Suspense>
    );
}
