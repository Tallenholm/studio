import { getViolationsForUser } from '@/lib/firestoreService';
import MyViolationsClientPage from './MyViolationsClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';
import { cookies } from 'next/headers';

const getUserId = (): string | null => {
    return cookies().get('user_id')?.value || null;
}

export default async function MyViolationsPage() {
    const userId = getUserId();
    const initialViolations = userId ? await getViolationsForUser(userId) : [];
    const sortedViolations = initialViolations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Suspense fallback={<PageSkeleton />}>
            <MyViolationsClientPage initialViolations={sortedViolations} />
        </Suspense>
    );
}
