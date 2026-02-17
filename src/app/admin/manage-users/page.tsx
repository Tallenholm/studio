import { getUsers } from '@/lib/firestoreService';
import UserManagementClientPage from './UserManagementClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function ManageUsersPage() {
    const users = await getUsers();
    const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Suspense fallback={<PageSkeleton />}>
            <UserManagementClientPage initialUsers={sortedUsers} />
        </Suspense>
    );
}
