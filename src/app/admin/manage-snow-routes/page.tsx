import { getSnowJobs, getUsers, getFleetAssets, getSnowRoutes } from '@/lib/firestoreService';
import ManageSnowRoutesClientPage from './ManageSnowRoutesClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

export default async function ManageSnowRoutesPage() {
    const [routes, snowJobs, users, assets] = await Promise.all([
        getSnowRoutes(),
        getSnowJobs(),
        getUsers(),
        getFleetAssets(),
    ]);

    return (
        <Suspense fallback={<PageSkeleton />}>
            <ManageSnowRoutesClientPage
                initialRoutes={routes}
                initialSnowJobs={snowJobs}
                initialUsers={users}
                initialFleetAssets={assets}
            />
        </Suspense>
    );
}
