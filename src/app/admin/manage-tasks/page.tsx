import { getUsers, getPendingTasks, getCompletedTasks } from '@/lib/firestoreService';
import ManageTasksClientPage from './ManageTasksClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

export default async function ManageTasksPage() {
    const [users, pendingTasks, completedTasks] = await Promise.all([
        getUsers(),
        getPendingTasks(),
        getCompletedTasks(),
    ]);

    return (
        <Suspense fallback={<PageSkeleton />}>
            <ManageTasksClientPage
                initialUsers={users}
                initialPendingTasks={pendingTasks}
                initialCompletedTasks={completedTasks}
            />
        </Suspense>
    );
}
