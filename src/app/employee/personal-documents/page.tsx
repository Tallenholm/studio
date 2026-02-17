import { getDocumentsForUser } from '@/lib/firestoreService';
import PersonalDocumentsClientPage from './PersonalDocumentsClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';
import { cookies } from 'next/headers';

const getUserId = (): string | null => {
    return cookies().get('user_id')?.value || null;
}

export default async function PersonalDocumentsPage() {
    const userId = getUserId();
    const initialDocuments = userId ? await getDocumentsForUser(userId) : [];

    return (
        <Suspense fallback={<PageSkeleton />}>
            <PersonalDocumentsClientPage initialDocuments={initialDocuments} />
        </Suspense>
    );
}
