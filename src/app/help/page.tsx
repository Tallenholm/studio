
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, Info } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I add or update Vehicle Identification Numbers (VINs)?",
      answer: "Navigate to the 'VIN Entry' page from the sidebar. Enter the VINs for your truck, trailer, and/or skid steer in the respective fields and click 'Save VINs'. These saved VINs will then be automatically used when you start a new inspection.",
    },
    {
      question: "What's the difference between Pre-Trip and Post-Trip Inspections?",
      answer: "Pre-Trip inspections are conducted before operating a vehicle or equipment to ensure it's safe and ready for use. Post-Trip inspections are done after operation to identify any issues that may have occurred during use, helping to schedule maintenance proactively.",
    },
    {
      question: "How does the AI Anomaly Detection work?",
      answer: "After you complete a Pre-Trip inspection, you'll have an option to 'Run AI Analysis' on the report details page. The AI compares the current report with past pre-trip reports for the same vehicle (based on VIN) to identify unusual patterns, deviations, or potential maintenance needs. It then provides a summary of its findings.",
    },
    {
      question: "Where is my inspection data stored?",
      answer: "All inspection reports and VIN information are stored locally in your web browser's local storage. This means the data is private to your browser and device. No data is sent to an external server for storage in the current version.",
    },
    {
      question: "Can I view past inspection reports?",
      answer: "Yes! Go to the 'Inspection Reports' page from the sidebar. You'll see a list of all your submitted reports. Click 'View' on any report to see its details.",
    },
    {
      question: "What happens if an item fails during an inspection?",
      answer: "If you mark an item as 'Fail', you'll be required to provide notes explaining the issue. The overall report will also be marked as 'Fail'. This helps in tracking and addressing necessary repairs or maintenance.",
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
