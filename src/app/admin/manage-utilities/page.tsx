
'use client';

import JobManagementPage from '@/components/admin/JobManagementPage';
import { Wrench } from 'lucide-react';

export default function ManageUtilitiesPage() {
    return (
        <JobManagementPage 
            jobType="utilities"
            pageTitle="Manage Utilities Jobs" 
            pageDescription="Track all sewer, water line, and drainage work."
            pageIcon={Wrench}
            aiPromptExample="e.g., Repair broken water line for the city at 123 Elm St. Urgent, start today. Job value is $5,500."
            addJobButtonText="Add New Utilities Job"
        />
    );
}
