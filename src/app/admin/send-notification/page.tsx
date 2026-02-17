import { getUsers } from '@/lib/firestoreService';
import SendNotificationClientPage from './SendNotificationClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

export default async function SendNotificationPage() {
    const users = await getUsers();

    return (
        <Suspense fallback={<PageSkeleton variant="form" />}>
            <SendNotificationClientPage initialUsers={users} />
        </Suspense>
    );
}
