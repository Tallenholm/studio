
'use client';

import JobManagementPage from '@/components/admin/JobManagementPage';
import { Briefcase } from 'lucide-react';

export default function ManageJobsPage() {
    return (
        <JobManagementPage 
            pageTitle="Manage Jobs" 
            pageDescription="Assign and track excavation, snow removal, concrete, and miscellaneous jobs."
            pageIcon={Briefcase}
            aiPromptExample="e.g., Excavate the foundation for Main Street Properties at 456 Central Ave. Start tomorrow and finish in two weeks. The job is worth $75,000."
            addJobButtonText="Add New Job"
        />
    );
}
