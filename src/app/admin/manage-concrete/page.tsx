
'use client';

import JobManagementPage from '@/components/admin/JobManagementPage';
import { Droplets } from 'lucide-react';

export default function ManageConcretePage() {
    return (
        <JobManagementPage 
            jobType="concrete"
            pageTitle="Manage Concrete Jobs" 
            pageDescription="Assign and track all concrete pouring and finishing jobs."
            pageIcon={Droplets}
            aiPromptExample="e.g., Pour a 20x30 foot patio slab for City Development Group at 456 Central Ave. Start next Monday and finish by Wednesday. The job is worth $12,000."
            addJobButtonText="Add New Concrete Job"
        />
    );
}
