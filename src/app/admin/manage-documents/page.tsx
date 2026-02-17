import { getDocuments, getFleetAssets, getUsers, getClients } from '@/lib/firestoreService';
import ManageDocumentsClientPage from './ManageDocumentsClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function ManageDocumentsPage() {
    const [docs, assets, usersData, clientsData] = await Promise.all([
        getDocuments(),
        getFleetAssets(),
        getUsers(),
        getClients(),
    ]);

    return (
        <Suspense fallback={<PageSkeleton />}>
            <ManageDocumentsClientPage
                initialDocuments={docs}
                initialFleetAssets={assets}
                initialUsers={usersData}
                initialClients={clientsData}
            />
        </Suspense>
    );
}
