import { getGeneralDocuments } from '@/lib/firestoreService';
import CompanyDocumentsClientPage from './CompanyDocumentsClientPage';
import { Suspense } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';

// This is the new Server Component
export default async function CompanyDocumentsPage() {
    
    // Fetch data on the server
    const documents = await getGeneralDocuments();

    return (
        <Suspense fallback={<PageSkeleton />}>
            <CompanyDocumentsClientPage initialDocuments={documents} />
        </Suspense>
    );
}
