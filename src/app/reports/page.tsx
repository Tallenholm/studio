import { getInspectionReports, getFleetAssets, getReportsForUser } from '@/lib/firestoreService';
import ReportsListClientPage from './ReportsListClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';
import { cookies } from 'next/headers';

// This is a placeholder for a real user session service
async function getCurrentUserRole() {
    // In a real app, you'd get this from a session cookie, JWT, etc.
    // For this context, we simulate it. Let's assume a cookie might exist.
    const role = cookies().get('user_role')?.value;
    if (role === 'employee' || role === 'manager' || role === 'owner') {
        return { role, uid: cookies().get('user_id')?.value || 'placeholder-uid' };
    }
    return { role: 'admin' as const, uid: 'placeholder-uid' };
}

export default async function ReportsPage() {
    const userSession = await getCurrentUserRole();

    const fetchReportsPromise = (userSession.role === 'employee')
        ? getReportsForUser(userSession.uid)
        : getInspectionReports();

    const [reports, assets] = await Promise.all([
        fetchReportsPromise,
        getFleetAssets(),
    ]);

    return (
        <Suspense fallback={<PageSkeleton />}>
            <ReportsListClientPage initialReports={reports} initialAssets={assets} />
        </Suspense>
    );
}
