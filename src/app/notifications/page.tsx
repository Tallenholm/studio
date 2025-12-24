

'use client';

import { useState, useEffect } from 'react';
import { updateNotification } from '@/lib/firestoreService';
import type { NotificationMessage } from '@/lib/types';
import { useUser } from '@/firebase/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bell, Loader2, Circle, Mail } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firestoreService';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  
  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    const db = getFirestoreInstance();

    const notificationsRef = collection(db, "notifications");
    const q = query(
        notificationsRef, 
        where('recipientId', 'in', ['all', user.id]),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveNotifications: NotificationMessage[] = [];
        snapshot.forEach(doc => {
            liveNotifications.push({ id: doc.id, ...doc.data() } as NotificationMessage);
        });
        // Sort on the client side
        liveNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setNotifications(liveNotifications);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching real-time notifications:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;

    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.readBy.includes(user.id)) {
        const updatedReadBy = [...notification.readBy, user.id];
        await updateNotification(notificationId, { readBy: updatedReadBy });
        // The real-time listener will handle the UI update automatically.
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Notifications...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Here are your recent messages and alerts. Click a message to expand it and mark it as read.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-2">
              {notifications.map(notif => {
                const isRead = notif.readBy.includes(user!.id);
                return (
                  <AccordionItem 
                    value={notif.id} 
                    key={notif.id} 
                    className={cn(
                        "border rounded-lg overflow-hidden transition-colors", 
                        !isRead ? 'border-primary/50 bg-primary/10 hover:bg-primary/20' : 'bg-card'
                    )}
                    onClick={() => handleMarkAsRead(notif.id)}
                    >
                    <AccordionTrigger className="p-4 text-left hover:no-underline">
                        <div className="flex items-center gap-4 w-full">
                            {!isRead && <Circle className="h-2.5 w-2.5 fill-primary text-primary flex-shrink-0" />}
                            <div className={cn("flex-1 grid gap-1", isRead && "ml-7")}>
                                <div className="flex justify-between items-start">
                                    <span className={cn("text-base", !isRead ? "font-bold" : "font-semibold")}>{notif.title}</span>
                                     <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(parseISO(notif.timestamp), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground text-left">
                                  From: {notif.senderName}
                                </p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0 pl-11">
                        <div className="prose dark:prose-invert max-w-none text-foreground/90">
                           {notif.content}
                        </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                <Mail className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg">No notifications yet.</p>
              <p className="text-sm">New messages from administrators will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
