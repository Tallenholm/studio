
'use client';

import { useState } from 'react';
import type { User, NotificationMessage } from '@/lib/types';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addNotification } from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/common/PageHeader';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';

const notificationSchema = z.object({
  recipientId: z.string({ required_error: 'Please select a recipient.' }),
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Message content is required.'),
});

interface SendNotificationClientPageProps {
  initialUsers: User[];
}

export default function SendNotificationClientPage({ initialUsers }: SendNotificationClientPageProps) {
  const [users] = useState<User[]>(initialUsers);
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { recipientId: 'all' },
  });

  async function onSubmit(values: z.infer<typeof notificationSchema>) {
    if (!user) return;

    const newNotification: Omit<NotificationMessage, 'id'> = {
      ...values,
      senderName: user.name,
      timestamp: new Date().toISOString(),
      readBy: [],
    };
    
    await addNotification(newNotification);
    toast({ title: 'Notification Sent', description: 'Your message has been broadcast.' });
    form.reset({ recipientId: 'all', title: '', content: '' });
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2"><Send className="h-8 w-8 text-primary"/>Send Notification</CardTitle>
          <CardDescription>Broadcast a message to all employees or send a targeted notification to a specific user.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="recipientId" render={({ field }) => (
                <FormItem><FormLabel>Recipient</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="all">All Employees</SelectItem>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>
              )} />
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Important: Weather Update" {...field}/></FormControl><FormMessage/></FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem><FormLabel>Message</FormLabel><FormControl><Textarea placeholder="Enter your message here..." {...field} rows={5} /></FormControl><FormMessage/></FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit">Send Message</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
