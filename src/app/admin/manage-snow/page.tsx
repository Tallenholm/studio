
'use client';

import JobManagementPage from '@/components/admin/JobManagementPage';
import { Snowflake } from 'lucide-react';

export default function ManageSnowPage() {
    return (
        <JobManagementPage 
            pageTitle="Manage Snow Contracts" 
            pageDescription="Create contracts, define services, and assign routes to your fleet and crews."
            pageIcon={Snowflake}
            aiPromptExample="e.g., Plow the lot for Main Street Properties at 456 Central Ave for the whole winter season. Start Dec 1, end March 31. The contract is worth $25,000."
            addJobButtonText="Add New Contract"
        />
    );
}
