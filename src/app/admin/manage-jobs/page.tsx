

'use client';

import JobManagementPage from '@/components/admin/JobManagementPage';
import { Briefcase } from 'lucide-react';

export default function ManageJobsPage() {
    return (
        <JobManagementPage 
            pageTitle="Manage Jobs" 
            pageDescription="Create, assign, and track all company jobs and contracts from a single, unified interface."
            pageIcon={Briefcase}
        />
    );
}
