
'use client';

import JobManagementPage from '@/components/admin/JobManagementPage';
import { Sprout } from 'lucide-react';

export default function ManageLandscapingPage() {
    return (
        <JobManagementPage 
            jobType="landscaping"
            pageTitle="Manage Landscaping Jobs" 
            pageDescription="Track all sod, ground restoration, and landscaping jobs."
            pageIcon={Sprout}
            aiPromptExample="e.g., Install 2000 sq ft of sod for the new construction at 789 Park Lane. Schedule for early next month."
            addJobButtonText="Add New Landscaping Job"
        />
    );
}
