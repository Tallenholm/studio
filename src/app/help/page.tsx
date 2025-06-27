
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, Info } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I perform a vehicle inspection and report damage?",
      answer: "From the Employee Hub, go to 'Fleet Check' and select either 'Pre-Trip' or 'Post-Trip'. Select the vehicle(s) you are inspecting. To report damage or an issue, mark the relevant checklist item as 'Fail'. You must provide detailed notes about the issue in the text box that appears. You can also add a photo. Once complete, click 'Submit Inspection'. Any failed items will automatically be flagged for review on the Admin Dashboard.",
    },
    {
      question: "How does the AI Anomaly Detection work?",
      answer: "After you complete a Pre-Trip inspection, you'll be taken to the report page where you can click 'Run AI Analysis'. The AI compares the current report with past pre-trip reports for the same vehicle (based on VIN) to identify unusual patterns or potential maintenance needs. It then provides a summary of its findings.",
    },
    {
      question: "How do I request time off?",
      answer: "From the Employee Hub, go to the 'Time Off' page. Use the calendar to select the start and end date for your request, provide a brief reason, and click 'Submit Request'. You can view the status of your past requests on the same page.",
    },
    {
      question: "How do I submit an expense for reimbursement?",
      answer: "From the Employee Hub, navigate to 'Submit Expense'. Fill out the form with the date, amount, category, and a brief description of the expense. You must upload a photo of the receipt. After submitting, your expense will be sent to an administrator for approval. You can track the status of your submissions on the same page.",
    },
    {
        question: "How do I complete an assigned task?",
        answer: "From the Employee Hub, go to 'My Tasks'. You will see a list of tasks assigned to you. Click 'Mark as Complete', add any required notes, and upload a photo if requested. Once you submit, the task will be marked as complete.",
    },
    {
        question: "How do I view notifications from my manager?",
        answer: "Click on the 'Notifications' link in the sidebar or on the Employee Hub. This will take you to your message center. New, unread messages will be highlighted. Click on a message to expand it and mark it as read.",
    },
    {
        question: "Where can I find vehicle documents like registration or insurance?",
        answer: "Navigate to the 'Vehicle Documents' page from the Employee Hub or the sidebar. Documents are grouped by vehicle or category. Click on a document to view or download it.",
    },
    {
      question: "What are the different Admin roles and what can they do?",
      answer: "As an Administrator, you have full access to manage the application. You can add/remove fleet assets ('Manage Fleet'), manage employee accounts and PINs ('Manage Users'), approve or deny time off ('Manage Requests'), add/remove company events ('Manage Calendar'), upload documents ('Manage Documents'), log safety or conduct issues ('Manage Violations'), log maintenance history ('Maintenance Logs'), assign tasks ('Manage Tasks') and send notifications to employees.",
    },
    {
      question: "How do I add and manage clients?",
      answer: "As an Administrator, go to 'Manage Clients' from the dashboard or sidebar. Here you can add new clients with their contact information, or remove existing ones. This client list is then used when creating and assigning jobs.",
    },
    {
      question: "How do I create and track jobs?",
      answer: "From the 'Manage Jobs' page, you can create a new job, give it a name, assign it to a client from the dropdown list, and set its address and date range. Jobs are automatically organized into 'Upcoming', 'Active', and 'Completed' columns based on their dates, giving you a clear view of your current workload.",
    },
    {
      question: "How do I approve or deny employee expenses?",
      answer: "As an Administrator, go to 'Manage Expenses' from your dashboard. You will see a list of all pending expense reports. You can review the details, view the uploaded receipt, and then choose to 'Approve' or 'Deny' the request. The employee will see the updated status in their portal.",
    },
    {
      question: "How do I manage employee tasks?",
      answer: "As an Administrator, go to 'Manage Tasks' from your dashboard. You can assign new tasks with descriptions and specify if photo verification is required. You can also view the status of all assigned tasks, including any photos uploaded by employees for verification.",
    },
    {
      question: "How do I log maintenance for a vehicle?",
      answer: "As an Administrator, navigate to the 'Maintenance Logs' section from your dashboard. Click 'Log New Service', fill in the details about the service performed, including the date, cost, and description, and select the asset it applies to. All past logs are visible on this page.",
    },
    {
      question: "Where is my data stored?",
      answer: "All application data, including reports, users, and documents, is stored locally in your web browser's local storage. This means the data is private to your browser and device. No data is sent to an external server for storage.",
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Help & Support
          </CardTitle>
          <CardDescription>
            Find answers to common questions and learn how to use the Fleet Check application effectively.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Info className="h-6 w-6 text-accent" />Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index} className="border-b">
                  <AccordionTrigger className="text-left hover:no-underline py-4 text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4 text-muted-foreground text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Mail className="h-6 w-6 text-accent" />Contact Support</h2>
            <p className="text-muted-foreground">
              If you encounter any issues or have questions not covered in the FAQ, please reach out to our support team (this is a placeholder).
            </p>
            <p className="mt-2">
              <span className="font-semibold">Email:</span> <Link href="mailto:support@example.com" className="text-primary hover:underline">support@example.com</Link> (Illustrative)
            </p>
             <p className="text-sm text-muted-foreground mt-4">
              For feature requests or feedback, please let us know!
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
