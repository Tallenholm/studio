import { getTasksForUser } from '@/lib/firestoreService';
import MyTasksClientPage from './MyTasksClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/types';


// This is a placeholder. In a real app, this would be handled by your auth provider.
const getUserId = (): string | null => {
    return cookies().get('user_id')?.value || null;
}

export default async function MyTasksPage() {
    const userId = getUserId();
    // Fetch data on the server if we have a user ID.
    const initialTasks = userId ? await getTasksForUser(userId) : [];
    const sortedTasks = initialTasks.sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime());

    return (
        <Suspense fallback={<PageSkeleton />}>
            <MyTasksClientPage initialTasks={sortedTasks} />
        </Suspense>
    );
}
