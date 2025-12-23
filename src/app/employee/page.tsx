
import { getEmployeeDashboardData } from '@/app/actions/getEmployeeDashboardData';
import EmployeeHubClientPage from '@/components/employee/EmployeeHubClientPage';

// This is now a React Server Component (RSC)
export default async function EmployeeHubPage() {
    // Fetch data on the server using the server action.
    // The RouteGuard already ensures an authenticated user is present.
    const initialDashboardData = await getEmployeeDashboardData();

    // Pass the server-fetched data to the client component
    return (
        <EmployeeHubClientPage
            initialData={initialDashboardData}
        />
    );
}
