import { getAdvancedReportData } from '@/app/actions/getAdvancedReportData';
import AdvancedReportsClientPage from './AdvancedReportsClientPage';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

export default async function AdvancedReportsPage() {
    // Fetch initial data on the server with default filters
    const initialData = await getAdvancedReportData('all_time', 'all');

    return (
        <Suspense fallback={<PageSkeleton variant="dashboard" />}>
            <AdvancedReportsClientPage initialData={initialData} />
        </Suspense>
    );
}
