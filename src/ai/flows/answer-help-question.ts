'use server';
/**
 * @fileOverview A Genkit flow for answering user questions about the application.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// This text is extracted from the faqs array in src/app/help/page.tsx
const helpContext = `
- Question: I just logged in for the first time. What was that tour?
- Answer: Welcome! The first time you log in, the application provides a brief guided tour to introduce you to the key features of your dashboard. This tour is designed to help you get started quickly. It will only appear once.
- Question: How do I use the new AI assistant?
- Answer: The AI assistant has two main functions. On the Help page, you can ask it questions about how to use the application. On the 'Manage Jobs' page, administrators can use the 'Create with AI' button to generate a new job from a simple text description, which speeds up the form-filling process.
- Question: How do I use the AI Daily Briefing on the Admin Dashboard?
- Answer: The AI Daily Briefing is your intelligent assistant that automatically summarizes the most important information for your day. When you log in, the AI analyzes all new reports, jobs, and requests to highlight urgent issues (like failed inspections), list your scheduled jobs and events for the day, and remind you of any pending actions like time-off or expense approvals. It helps you prioritize your work without having to manually check every section of the app.
- Question: How do I perform a vehicle inspection and report damage?
- Answer: From the Employee Hub, go to 'Fleet Check' and select either 'Pre-Trip' or 'Post-Trip'. Select the vehicle(s) you are inspecting. To report damage or an issue, mark the relevant checklist item as 'Fail'. You must provide detailed notes about the issue in the text box that appears. You can also add a photo. Once complete, click 'Submit Inspection'. Any failed items will automatically be flagged for review on the Admin Dashboard.
- Question: How are Work Orders created and managed?
- Answer: When an inspection is submitted with one or more 'Failed' items, an administrator can create a Work Order directly from that report. From the report page, the admin can click 'Create Work Order'. This generates a new entry on the 'Manage Work Orders' page, pre-filled with the vehicle information and issue description. Admins can then update the status, add notes, and track costs. When an admin completes a work order, the system automatically creates a corresponding entry in the Maintenance Logs, ensuring a complete and seamless audit trail for the repair. You can also click the eye icon on any work order to navigate directly back to the original inspection report that generated it.
- Question: How does the AI Anomaly Detection work?
- Answer: After you complete a Pre-Trip inspection, you'll be taken to the report page where you can click 'Run AI Analysis'. The AI compares the current report with past pre-trip reports for the same vehicle (based on VIN) to identify unusual patterns or potential maintenance needs. It then provides a summary of its findings.
- Question: How do I use the Advanced Reports page?
- Answer: Navigate to 'Advanced Reports' from the Admin Dashboard or sidebar. This page provides a powerful analytics overview of your fleet's data. You can use the filters at the top to narrow down the data by a specific date range (e.g., 'Last 30 Days') or by vehicle type (e.g., 'Trucks only'). The charts will update in real-time to reflect your selections, allowing you to gain deeper insights into trends and costs.
- Question: How do I request time off?
- Answer: From the Employee Hub, go to the 'Time Off' page. Use the calendar to select the start and end date for your request, provide a brief reason, and click 'Submit Request'. You can view the status of your past requests on the same page. When your request is approved, it will be automatically added to the company calendar.
- Question: How do I submit an expense for reimbursement?
- Answer: From the Employee Hub, navigate to 'Submit Expense'. Fill out the form with the date, amount, category, and a brief description of the expense. You must upload a photo of the receipt. After submitting, your expense will be sent to an administrator for approval. You can track the status of your submissions on the same page.
- Question: How do I complete an assigned task?
- Answer: From the Employee Hub, go to 'My Tasks'. You will see a list of tasks assigned to you. Click 'Mark as Complete', add any required notes, and upload a photo if requested. Once you submit, the task will be marked as complete.
- Question: How do I view notifications from my manager?
- Answer: Click on the 'Notifications' link in the sidebar or on the Employee Hub. This will take you to your message center. New, unread messages will be highlighted. Click on a message to expand it and mark it as read.
- Question: Where can I find documents?
- Answer: There are two document pages. 'Company Documents' contains general files for all employees, like safety manuals and vehicle information. 'Personal Documents' is a secure area where you can find your own tax forms (like W-2s) and employment-related documents (like your I-9). Both can be accessed from your Employee Hub or the sidebar.
- Question: How do I upload or manage documents as an administrator?
- Answer: Navigate to 'Manage Documents' from your dashboard. When adding a new document, you must select its type: General, Tax, or Employment. For 'General' documents, you assign them to a text-based category (e.g., 'Company Policies'). For 'Tax' or 'Employment' documents, you must assign them to a specific employee from a dropdown list. This ensures they only appear in that employee's secure 'Personal Documents' section.
- Question: What are the different Admin roles and what can they do?
- Answer: There are two levels of administrative access: Manager and Owner. 'Managers' can handle day-to-day operations like managing tasks, violations, and documents. 'Owners' have full system access, including all manager permissions, plus the ability to manage users, clients, jobs, expenses, and view advanced financial reports. Only an Owner can change another user's role.
- Question: How do I add and manage clients?
- Answer: As an 'Owner', go to 'Manage Clients' from the dashboard or sidebar. Here you can add new clients with their contact information, edit existing clients, or remove them. This client list is then used when creating and assigning jobs.
- Question: How do I create and track jobs?
- Answer: As an 'Owner', go to the 'Manage Jobs' page. You can create a new job, give it a name, assign it to a client, set its address, and define the date range. You can also edit existing jobs, assign specific fleet assets, and track job value. You can use the search and filter controls to quickly find specific jobs by name, client, or status. Jobs are automatically organized into 'Upcoming', 'Active', and 'Completed' sections. For full details and a job-specific notes log, click 'View Details' on any job.
- Question: How do I approve or deny employee expenses?
- Answer: As an 'Owner', go to 'Manage Expenses' from your dashboard. You will see a list of all pending expense reports. You can review the details, view the uploaded receipt, and then choose to 'Approve' or 'Deny' the request. The employee will see the updated status in their portal.
- Question: How do I manage employee tasks?
- Answer: As an Administrator, go to 'Manage Tasks' from your dashboard. You can assign new tasks with descriptions and specify if photo verification is required. You can also view the status of all assigned tasks, now conveniently separated into 'Pending' and 'Completed' lists. For completed tasks, you can review any notes and view verification photos submitted by employees, ensuring proper oversight.
- Question: How do I log or view an employee violation?
- Answer: As an administrator, navigate to 'Manage Violations' from your dashboard. Here you can log new incidents, including the type, date, and action taken. These records are for internal documentation. As an employee, you can view a private record of your own violations by navigating to the 'My Violations' page from your hub. This page is confidential and only displays your personal records.
- Question: How do I log maintenance for a vehicle?
- Answer: As an Administrator, navigate to the 'Maintenance Logs' section from your dashboard. Click 'Log New Service', fill in the details about the service performed, including the date, cost, and description, and select the asset it applies to. All past logs are visible on this page.
- Question: Where is my data stored?
- Answer: All application data, including reports, users, and documents, is stored locally in your web browser's local storage. This means the data is private to your browser and device. No data is sent to an external server for storage.
`;

const AnswerHelpQuestionInputSchema = z.string();
export type AnswerHelpQuestionInput = z.infer<typeof AnswerHelpQuestionInputSchema>;

const AnswerHelpQuestionOutputSchema = z.string();
export type AnswerHelpQuestionOutput = z.infer<typeof AnswerHelpQuestionOutputSchema>;

export async function answerHelpQuestion(input: AnswerHelpQuestionInput): Promise<AnswerHelpQuestionOutput> {
  return answerHelpQuestionFlow(input);
}

const prompt = ai.definePrompt({
    name: 'answerHelpQuestionPrompt',
    input: {schema: AnswerHelpQuestionInputSchema},
    output: {schema: AnswerHelpQuestionOutputSchema},
    prompt: `You are a helpful AI assistant for the "Logan's Excavating" application. Your only goal is to answer user questions about how to use the app.

Base your answer *exclusively* on the provided context below. Do not use any outside knowledge. If the answer is not in the context, politely state that you cannot answer the question. Keep your answers concise and to the point.

CONTEXT:
${helpContext}

USER QUESTION:
"{{prompt}}"

ANSWER:`,
});

const answerHelpQuestionFlow = ai.defineFlow(
  {
    name: 'answerHelpQuestionFlow',
    inputSchema: AnswerHelpQuestionInputSchema,
    outputSchema: AnswerHelpQuestionOutputSchema,
  },
  async (question) => {
    const {output} = await prompt(question);
    return output!;
  }
);
