import { getCalendarEvents } from '@/lib/firestoreService';
import ManageCalendarClientPage from './ManageCalendarClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

export default async function ManageCalendarPage() {
    const initialEvents = await getCalendarEvents();
    
    return (
        <Suspense fallback={<PageSkeleton variant="table" />}>
            <ManageCalendarClientPage initialEvents={initialEvents} />
        </Suspense>
    );
}
