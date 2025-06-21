
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, Info } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I perform a vehicle inspection?",
      answer: "From the Employee Hub, go to 'Fleet Check' and select either 'Pre-Trip' or 'Post-Trip'. Select the vehicle(s) you are inspecting from the dropdown menus. Go through each tab (Truck, Trailer, etc.) and mark each checklist item as 'Pass' or 'Fail'. If an item fails, you must provide notes. You can also add a photo. Once complete, click 'Submit Inspection'.",
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
        question: "How do I view notifications from my manager?",
        answer: "Click on the 'Notifications' link in the sidebar or on the Employee Hub. This will take you to your message center. New, unread messages will be highlighted. Click on a message to expand it and mark it as read.",
    },
    {
        question: "Where can I find vehicle documents like registration or insurance?",
        answer: "Navigate to the 'Vehicle Documents' page from the Employee Hub or the sidebar. Documents are grouped by vehicle or category. Click on a document to view or download it.",
    },
    {
      question: "What are the different Admin roles and what can they do?",
      answer: "As an Administrator, you have full access to manage the application. You can add/remove fleet assets ('Manage Fleet'), manage employee accounts and PINs ('Manage Users'), approve or deny time off ('Manage Requests'), add/remove company events ('Manage Calendar'), upload documents ('Manage Documents'), log safety or conduct issues ('Manage Violations'), and send notifications to employees.",
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
