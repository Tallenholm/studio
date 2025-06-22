
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadTasks, saveTasks } from '@/lib/localStorageService';
import type { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ClipboardList, Loader2, CheckCircle2, Camera, FileUp, Eye } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

const completeTaskSchema = z.object({
  completionNotes: z.string().optional(),
  completionPhotoUri: z.string().optional(),
}).superRefine((data, ctx) => {
    // This validation logic will be dynamically applied based on the task
});

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof completeTaskSchema>>({
    resolver: zodResolver(completeTaskSchema),
  });

  useEffect(() => {
    if (user) {
        setIsMounted(true);
        const allTasks = loadTasks();
        setTasks(allTasks.filter(t => t.assignedToEmployeeId === user.id).sort((a,b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()));
    }
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('completionPhotoUri', reader.result as string);
        form.clearErrors('completionPhotoUri');
      };
      reader.readAsDataURL(file);
    }
  };

  function onCompleteSubmit(values: z.infer<typeof completeTaskSchema>) {
    if (!selectedTask) return;

    if (selectedTask.requiresPhoto && !values.completionPhotoUri) {
        form.setError('completionPhotoUri', { message: 'A photo is required for this task.' });
        return;
    }

    const allTasks = loadTasks();
    const updatedTasks = allTasks.map(task => {
        if (task.id === selectedTask.id) {
            return {
                ...task,
                status: 'completed' as const,
                dateCompleted: new Date().toISOString(),
                completionNotes: values.completionNotes,
                completionPhotoUri: values.completionPhotoUri,
            };
        }
        return task;
    });

    saveTasks(updatedTasks);
    // Refresh local state
    setTasks(updatedTasks.filter(t => t.assignedToEmployeeId === user?.id).sort((a,b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()));

    toast({ title: 'Task Completed', description: `"${selectedTask.title}" marked as complete.` });
    setIsDialogOpen(false);
    setSelectedTask(null);
    form.reset();
  }

  const openCompleteDialog = (task: Task) => {
    setSelectedTask(task);
    form.reset({ completionNotes: '', completionPhotoUri: '' }); // Clear form on open
    setIsDialogOpen(true);
  }

  if (!isMounted || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Your Tasks...</p>
      </div>
    );
  }
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <ClipboardList className="h-8 w-8 text-primary" />
                My Assigned Tasks
            </CardTitle>
            <CardDescription>Here are the tasks assigned to you. Complete them as required.</CardDescription>
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4">Pending Tasks ({pendingTasks.length})</h2>
        {pendingTasks.length > 0 ? (
            <div className="space-y-4">
            {pendingTasks.map(task => (
                <Card key={task.id} className="p-4">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className="font-bold text-lg">{task.title}</p>
                            <p className="text-sm text-muted-foreground">Assigned {formatDistanceToNow(new Date(task.dateAssigned), { addSuffix: true })} by {task.createdByAdminName}</p>
                        </div>
                        <Button onClick={() => openCompleteDialog(task)}>
                            <CheckCircle2 className="mr-2 h-5 w-5" /> Mark as Complete
                        </Button>
                    </div>
                    <p className="mt-2 text-foreground/80">{task.description}</p>
                    {task.requiresPhoto && <p className="mt-1 text-sm font-medium flex items-center gap-1 text-accent-foreground"><Camera className="h-4 w-4"/>Photo verification required.</p>}
                </Card>
            ))}
            </div>
        ) : (
             <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">You have no pending tasks.</div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-headline font-semibold mb-4">Completed Tasks ({completedTasks.length})</h2>
        {completedTasks.length > 0 ? (
            <div className="space-y-4">
            {completedTasks.map(task => (
                <Card key={task.id} className="p-4 bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg text-muted-foreground line-through">{task.title}</p>
                            <p className="text-sm text-muted-foreground">Completed: {task.dateCompleted ? format(new Date(task.dateCompleted), 'PPp') : 'N/A'}</p>
                        </div>
                        <Badge variant="default" className="bg-green-600">Completed</Badge>
                    </div>
                    {task.completionNotes && <p className="text-sm mt-2 bg-background/50 p-2 rounded-md"><strong>Your Notes:</strong> {task.completionNotes}</p>}
                    {task.completionPhotoUri && (
                        <div className="mt-2">
                             <Image
                                src={task.completionPhotoUri}
                                alt={`Verification for ${task.title}`}
                                width={128}
                                height={128}
                                className="rounded-md border object-cover aspect-square"
                            />
                        </div>
                    )}
                </Card>
            ))}
            </div>
        ) : (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">You have not completed any tasks yet.</div>
        )}
      </section>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Complete Task: {selectedTask?.title}</DialogTitle>
                <DialogDescription>
                Provide any notes and upload a photo if required to complete this task.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onCompleteSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="completionNotes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Notes (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Add any relevant notes about the task completion." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {selectedTask?.requiresPhoto && (
                        <FormField
                            control={form.control}
                            name="completionPhotoUri"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Verification Photo (Required)</FormLabel>
                                    <FormControl>
                                        <div>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <FileUp className="mr-2 h-4 w-4" />
                                            Upload Photo
                                        </Button>
                                        {field.value ? (
                                            <div className="mt-2 text-sm flex items-center gap-2">
                                                <Image src={field.value} alt="Preview" width={48} height={48} className="rounded-md" />
                                                <span>Photo selected. Ready to save.</span>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                                               <Camera className="h-4 w-4" />
                                                <span>No photo selected.</span>
                                            </div>
                                        )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                <DialogFooter>
                    <Button type="submit">Submit Completion</Button>
                </DialogFooter>
                </form>
            </Form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
