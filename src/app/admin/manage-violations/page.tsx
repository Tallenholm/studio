import { getUsers, getViolations } from '@/lib/firestoreService';
import ManageViolationsClientPage from './ManageViolationsClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function ManageViolationsPage() {
    const [users, violations] = await Promise.all([
        getUsers(),
        getViolations()
    ]);

    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <ManageViolationsClientPage initialUsers={users} initialViolations={violations} />
        </Suspense>
    );
}
