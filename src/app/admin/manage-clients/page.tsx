import { getClients, getJobs } from '@/lib/firestoreService';
import ClientsPage from './ClientsPage';
import type { Client, Job } from '@/lib/types';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Suspense } from 'react';

// This is the new Server Component
export default async function ManageClientsPage() {
    
    // Fetch data on the server
    const [clients, jobs] = await Promise.all([
        getClients(),
        getJobs()
    ]);

    // Perform the expensive aggregation on the server
    const statsByClientId = new Map<string, { jobCount: number, totalValue: number }>();
    for (const job of jobs) {
        if (job.clientId) {
            const currentStats = statsByClientId.get(job.clientId) || { jobCount: 0, totalValue: 0 };
            currentStats.jobCount += 1;
            currentStats.totalValue += job.jobValue || 0;
            statsByClientId.set(job.clientId, currentStats);
        }
    }

    const clientsWithStats = clients.map(client => {
        const stats = statsByClientId.get(client.id) || { jobCount: 0, totalValue: 0 };
        return {
            ...client,
            ...stats
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // The client component will no longer fetch its own data.
    // It will receive the pre-processed data as props.
    return (
        <Suspense fallback={<PageSkeleton />}>
            <ClientsPage initialClients={clientsWithStats} allJobs={jobs} />
        </Suspense>
    );
}
