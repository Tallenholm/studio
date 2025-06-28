
'use client';

import JobManagementPage from '@/components/admin/JobManagementPage';
import { Package } from 'lucide-react';

export default function ManageMiscPage() {
    return (
        <JobManagementPage 
            pageTitle="Manage Miscellaneous Jobs" 
            pageDescription="Track general labor, deliveries, or other jobs not covered by other categories."
            pageIcon={Package}
            aiPromptExample="e.g., Deliver three pallets of stone to City Development Group at 456 Central Ave tomorrow."
            addJobButtonText="Add New Misc. Job"
        />
    );
}
