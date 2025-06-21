
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadUsers, saveNotifications, loadNotifications } from '@/lib/localStorageService';
import type { User, NotificationMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { MailPlus, Send, Loader2 } from 'lucide-react';

const notificationSchema = z.object({
  recipient: z.string({ required_error: 'Please select a recipient.' }),
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Message content is required.'),
});

export default function SendNotificationPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      recipient: 'all',
      title: '',
      content: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setUsers(loadUsers());
  }, []);

  function onSubmit(values: z.infer<typeof notificationSchema>) {
    if (!adminUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const newNotification: NotificationMessage = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      senderName: adminUser.name,
      recipientId: values.recipient,
      title: values.title,
      content: values.content,
      readBy: [],
    };
    
    const allNotifications = loadNotifications();
    saveNotifications([...allNotifications, newNotification]);

    toast({ title: 'Notification Sent', description: 'Your message has been sent successfully.' });
    form.reset();
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
       <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out max-w-3xl mx-auto">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <MailPlus className="h-8 w-8 text-primary" />
                Send a Notification
            </CardTitle>
            <CardDescription>Compose and send a message to all users or a specific employee.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField
                            control={form.control}
                            name="recipient"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Recipient</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a recipient" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="all">All Employees</SelectItem>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Title / Subject</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Important: Weather Alert" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Message Content</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Enter the full message here."
                                    className="resize-y min-h-[150px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-5 w-5" />
                            )}
                            Send Message
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
       </Card>
    </div>
  );
}
