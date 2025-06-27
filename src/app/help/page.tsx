
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { faqs } from '@/lib/faq-data';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo, useState, useEffect } from 'react';

export default function HelpPage() {
  const { user, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayedFaqs = useMemo(() => {
    if (!user) {
      return faqs.common;
    }

    let combinedFaqs = [...faqs.common];
    if (user.role === 'employee' || user.role === 'manager' || user.role === 'owner') {
      combinedFaqs.push(...faqs.employee);
    }
    if (user.role === 'manager' || user.role === 'owner') {
      combinedFaqs.push(...faqs.manager);
    }
    if (user.role === 'owner') {
      combinedFaqs.push(...faqs.owner);
    }
    return combinedFaqs;
  }, [user]);

  if (isLoading || !isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Help Center...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Help & Support
          </CardTitle>
          <CardDescription>
            Find answers to common questions and learn how to use the Logan's Excavating application effectively. For immediate help, use the AI Assistant floating in the corner of your screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2"><Info className="h-6 w-6 text-accent" />Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {displayedFaqs.map((faq, index) => (
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
