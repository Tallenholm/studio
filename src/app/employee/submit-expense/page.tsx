import { getExpenseReportsForUser } from '@/lib/firestoreService';
import SubmitExpenseClientPage from './SubmitExpenseClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';
import { cookies } from 'next/headers';

const getUserId = (): string | null => {
    return cookies().get('user_id')?.value || null;
}

export default async function SubmitExpensePage() {
    const userId = getUserId();
    const initialReports = userId ? await getExpenseReportsForUser(userId) : [];
    const sortedReports = initialReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <SubmitExpenseClientPage initialReports={sortedReports} />
        </Suspense>
    );
}
