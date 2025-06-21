
'use client';

import { useState, useEffect } from 'react';
import { loadNotifications, saveNotifications } from '@/lib/localStorageService';
import type { NotificationMessage } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Bell, Loader2, Circle, Mail } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      const allNotifications = loadNotifications().sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const userNotifications = allNotifications.filter(
        notif => notif.recipientId === 'all' || notif.recipientId === user.id
      );
      setNotifications(userNotifications);
    }
    setIsMounted(true);
  }, [user]);

  const handleMarkAsRead = (notificationId: string) => {
    if (!user) return;

    const updatedNotifications = notifications.map(notif => {
      if (notif.id === notificationId && !notif.readBy.includes(user.id)) {
        return { ...notif, readBy: [...notif.readBy, user.id] };
      }
      return notif;
    });

    setNotifications(updatedNotifications); // Optimistically update UI
    
    // Update master list in local storage
    const allNotifications = loadNotifications();
    const masterIndex = allNotifications.findIndex(n => n.id === notificationId);
    if (masterIndex > -1 && !allNotifications[masterIndex].readBy.includes(user.id)) {
        allNotifications[masterIndex].readBy.push(user.id);
        saveNotifications(allNotifications);
    }
  };

  if (!isMounted || !user) {
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
                const isRead = notif.readBy.includes(user.id);
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
                                        {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
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
