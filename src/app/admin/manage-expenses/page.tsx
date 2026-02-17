import { getExpenseReports } from '@/lib/firestoreService';
import ManageExpensesClientPage from './ManageExpensesClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

export default async function ManageExpensesPage() {
    const initialReports = await getExpenseReports();

    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <ManageExpensesClientPage initialReports={initialReports} />
        </Suspense>
    );
}
