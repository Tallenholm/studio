
export const faqs = {
  common: [
    {
      question: "I just logged in for the first time. What was that tour?",
      answer: "Welcome! The first time you log in, the application provides a brief guided tour to introduce you to the key features of your dashboard. This tour is designed to help you get started quickly. It will only appear once.",
    },
    {
      question: "How do I use the new AI assistant?",
      answer: "The AI assistant is available via the floating icon in the bottom-right corner of your screen. You can ask it questions about how to use the application at any time. On the 'Manage Jobs' page, administrators can also use the 'Create with AI' button to generate a new job from a simple text description, which speeds up the form-filling process.",
    },
    {
      question: "Where is my data stored?",
      answer: "All application data, including reports, users, and documents, is stored locally in your web browser's local storage. This means the data is private to your browser and device. No data is sent to an external server for storage.",
    },
  ],
  employee: [
    {
      question: "How do I perform a vehicle inspection and report damage?",
      answer: "From the Employee Hub, go to 'Fleet Check' and select either 'Pre-Trip' or 'Post-Trip'. Select the vehicle(s) you are inspecting. The checklists will appear on the same page. To report damage or an issue, mark the relevant item as 'Fail'. You must provide detailed notes about the issue in the text box that appears. You can also add a photo. Once complete, click 'Submit Inspection'. Any failed items will automatically be flagged for review on the Admin Dashboard.",
    },
    {
      question: "How do I request time off?",
      answer: "From the Employee Hub, go to the 'Time Off' page. Use the calendar to select the start and end date for your request, provide a brief reason, and click 'Submit Request'. You can view the status of your past requests on the same page. When your request is approved, it will be automatically added to the company calendar.",
    },
    {
      question: "How do I submit an expense for reimbursement?",
      answer: "From the Employee Hub, navigate to 'Submit Expense'. Fill out the form with the date, amount, category, and a brief description of the expense. You must upload a photo of the receipt. After submitting, your expense will be sent to an administrator for approval. You can track the status of your submissions on the same page.",
    },
    {
        question: "How do I complete an assigned task?",
        answer: "From the Employee Hub, go to 'My Tasks'. You will see a list of tasks assigned to you. Click 'Mark as Complete'. If photo verification is required, you can use your device's camera or upload a file. The photo will be stamped with the date, time, and GPS coordinates. Add any notes and submit. The task will then be marked as complete.",
    },
    {
        question: "How do I view notifications from my manager?",
        answer: "Click on the 'Notifications' link in the sidebar or on the Employee Hub. This will take you to your message center. New, unread messages will be highlighted. Click on a message to expand it and mark it as read.",
    },
    {
      question: "Where can I find documents?",
      answer: "There are two document pages. 'Company Documents' contains general files for all employees, like safety manuals and vehicle information. 'Personal Documents' is a secure area where you can find your own tax forms (like W-2s) and employment-related documents (like your I-9). Both can be accessed from your Employee Hub or the sidebar.",
    },
    {
      question: "How do I view an employee violation?",
      answer: "As an employee, you can view a private record of your own violations by navigating to the 'My Violations' page from your hub. This page is confidential and only displays your personal records.",
    },
  ],
  manager: [
    {
      question: "How do I use the AI Daily Briefing on the Admin Dashboard?",
      answer: "The AI Daily Briefing is your intelligent assistant that automatically summarizes the most important information for your day. When you log in, the AI analyzes all new reports, jobs, and requests to highlight urgent issues (like failed inspections), list your scheduled jobs and events for the day, and remind you of any pending actions like time-off or expense approvals. It helps you prioritize your work without having to manually check every section of the app.",
    },
    {
      question: "How are Work Orders created and managed?",
      answer: "When an inspection is submitted with one or more 'Failed' items, an administrator can create a Work Order directly from that report. From the report page, the admin can click 'Create Work Order'. This generates a new entry on the 'Manage Work Orders' page, pre-filled with the vehicle information and issue description. Admins can then update the status, add notes, and track costs. When an admin completes a work order, the system automatically creates a corresponding entry in the Maintenance Logs, ensuring a complete and seamless audit trail for the repair. You can also click the eye icon on any work order to navigate directly back to the original inspection report that generated it.",
    },
    {
      question: "How does the AI Anomaly Detection work?",
      answer: "After an employee completes a Pre-Trip inspection, you (as an admin) can view the report and click 'Run AI Analysis'. The AI compares the current report with past pre-trip reports for the same vehicle (based on VIN) to identify unusual patterns or potential maintenance needs. It then provides a summary of its findings.",
    },
     {
      question: "How do I upload or manage documents as an administrator?",
      answer: "Navigate to 'General Documents' from your dashboard. When adding a new document, you must select its type: General, Tax, or Employment. For 'General' documents, you assign them to a text-based category (e.g., 'Company Policies'). For 'Tax' or 'Employment' documents, you must assign them to a specific employee from a dropdown list. This ensures they only appear in that employee's secure 'Personal Documents' section. You can view all sensitive employee documents on the dedicated 'Personal Documents' page.",
    },
    {
      question: "How do I manage employee tasks?",
      answer: "As an Administrator, go to 'Manage Tasks' from your dashboard. You can assign new tasks with descriptions and specify if photo verification is required. You can also view the status of all assigned tasks, now conveniently separated into 'Pending' and 'Completed' lists. For completed tasks, you can review any notes and view verification photos submitted by employees, ensuring proper oversight.",
    },
    {
      question: "How do I log an employee violation?",
      answer: "As an administrator, navigate to 'Manage Violations' from your dashboard. Here you can log new incidents, including the type, date, and action taken. These records are for internal documentation.",
    },
    {
      question: "How do I log maintenance for a vehicle?",
      answer: "As an Administrator, navigate to the 'Maintenance Logs' section from your dashboard. Click 'Log New Service', fill in the details about the service performed, including the date, cost, and description, and select the asset it applies to. All past logs are visible on this page.",
    },
  ],
  owner: [
    {
      question: "How do I use the Advanced Reports page?",
      answer: "Navigate to 'Advanced Reports' from the Admin Dashboard or sidebar. This page provides a powerful analytics overview of your fleet's data. You can use the filters at the top to narrow down the data by a specific date range (e.g., 'Last 30 Days') or by vehicle type (e.g., 'Trucks only'). The charts will update in real-time to reflect your selections, allowing you to gain deeper insights into trends and costs.",
    },
    {
      question: "What are the different Admin roles and what can they do?",
      answer: "There are two levels of administrative access: Manager and Owner. 'Managers' can handle day-to-day operations like managing tasks, violations, and documents. 'Owners' have full system access, including all manager permissions, plus the ability to manage users, clients, jobs, expenses, and view advanced financial reports. Only an Owner can change another user's role.",
    },
    {
      question: "How do I manage snow removal work differently from excavation?",
      answer: "The application now has a dedicated 'Manage Snow Contracts' section, accessible from the dashboard and sidebar. This area is completely separate from the 'Manage Excavation Jobs' section. You can create, track, and manage your snow contracts here. Employees will see their snow assignments on a separate 'Snow Route Board' on their hub, ensuring a clear distinction between seasonal and regular work.",
    },
    {
      question: "How do I add and manage clients?",
      answer: "As an 'Owner', go to 'Manage Clients' from the dashboard or sidebar. Here you can add new clients with their contact information, edit existing clients, or remove them. This client list is then used when creating and assigning jobs.",
    },
    {
      question: "How do I create and track jobs?",
      answer: "As an 'Owner', go to the 'Manage Jobs' page. You can create a new job manually, or use the 'Create with AI' button to generate one from a simple description. You can also edit existing jobs, assign specific fleet assets, and track job value. Use the search and filter controls to quickly find specific jobs by name, client, or status. Jobs are automatically organized into 'Upcoming', 'Active', and 'Completed' sections. For full details and a job-specific notes log, click 'View Details' on any job.",
    },
    {
      question: "How do I approve or deny employee expenses?",
      answer: "As an 'Owner', go to 'Manage Expenses' from your dashboard. You will see a list of all pending expense reports. You can review the details, view the uploaded receipt, and then choose to 'Approve' or 'Deny' the request. The employee will see the updated status in their portal.",
    },
  ],
};
