
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadUsers, loadTasks, saveTasks } from '@/lib/localStorageService';
import type { User, Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, Trash2, ClipboardList, Loader2, Camera, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const taskSchema = z.object({
  assignedToEmployeeId: z.string({ required_error: 'Please select an employee.' }),
  title: z.string().min(1, 'Task title is required.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  requiresPhoto: z.boolean().default(false),
});

export default function ManageTasksPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAuth();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      requiresPhoto: false,
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setUsers(loadUsers());
    setTasks(loadTasks().sort((a,b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()));
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveTasks(tasks);
    }
  }, [tasks, isMounted]);

  function onSubmit(values: z.infer<typeof taskSchema>) {
    if (!adminUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'Admin not logged in.'});
        return;
    }
    const employee = users.find(u => u.id === values.assignedToEmployeeId);
    if (!employee) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected employee not found.' });
        return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      assignedToEmployeeId: employee.id,
      assignedToEmployeeName: employee.name,
      createdByAdminName: adminUser.name,
      dateAssigned: new Date().toISOString(),
      dateCompleted: null,
      status: 'pending',
      ...values,
    };
    setTasks(prev => [newTask, ...prev].sort((a,b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()));
    toast({ title: 'Task Assigned', description: `Task "${values.title}" has been assigned to ${employee.name}.` });
    setIsDialogOpen(false);
    form.reset({ title: '', description: '', requiresPhoto: false, assignedToEmployeeId: undefined });
  }

  function removeTask(taskId: string) {
    const taskToRemove = tasks.find(v => v.id === taskId);
    setTasks(prev => prev.filter(v => v.id !== taskId));
    toast({
      title: 'Task Removed',
      description: `The task "${taskToRemove?.title}" has been deleted.`,
      variant: 'destructive',
    });
  }

  const getStatusBadgeVariant = (status: Task['status']) => {
    switch (status) {
        case 'completed': return 'default';
        case 'pending': return 'secondary';
        default: return 'outline';
    }
}
  
  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Tasks...</p>
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const renderTaskList = (taskList: Task[]) => (
    <div className="space-y-4">
      {taskList.length > 0 ? (
        taskList.map(task => (
          <Card key={task.id} className="p-4 bg-muted/30">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="font-bold text-lg">{task.title}</p>
                      <p className="text-sm text-muted-foreground">Assigned to: {task.assignedToEmployeeName}</p>
                      <p className="text-sm text-muted-foreground">Assigned: {format(new Date(task.dateAssigned), 'PPP')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(task.status)} className={cn(task.status === 'completed' && 'bg-green-600')}>{task.status}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)} aria-label={`Remove task`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                  </div>
              </div>
              <p className="mt-2 text-foreground/80">{task.description}</p>
              {task.requiresPhoto && <p className="mt-1 text-sm font-medium flex items-center gap-1 text-accent-foreground"><Camera />Photo verification required.</p>}
              
              {task.status === 'completed' && (
                  <div className="mt-4 border-t pt-3">
                      <p className="text-sm text-muted-foreground">Completed: {task.dateCompleted ? format(new Date(task.dateCompleted), 'PPp') : 'N/A'}</p>
                      {task.completionNotes && <p className="text-sm mt-1 bg-background/50 p-2 rounded-md"><strong>Notes:</strong> {task.completionNotes}</p>}
                      {task.completionPhotoUri && (
                          <div className="mt-2">
                               <Link href={task.completionPhotoUri} target="_blank" rel="noopener noreferrer" className="block relative group w-32 h-32 rounded-md overflow-hidden border">
                                  <Image
                                      src={task.completionPhotoUri}
                                      alt={`Verification for ${task.title}`}
                                      fill
                                      className="object-cover object-top transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Eye className="h-8 w-8 text-white"/>
                                  </div>
                              </Link>
                          </div>
                      )}
                  </div>
              )}
          </Card>
        ))
      ) : (
        <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No tasks in this category.</div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <ClipboardList className="h-8 w-8 text-primary" />
                Manage Employee Tasks
              </CardTitle>
              <CardDescription className="mt-2">
                Assign tasks to employees and track their completion.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle />
                  Assign New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Assign a New Task</DialogTitle>
                  <DialogDescription>
                    Fill out the details for the task to be completed.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                        control={form.control}
                        name="assignedToEmployeeId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Assign To</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {users.filter(u => u.role === 'employee').map(user => (
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
                          <FormLabel>Task Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Clean out truck cab" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Provide a detailed description of the task." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="requiresPhoto"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>
                                Require photo verification?
                                </FormLabel>
                                <FormMessage />
                            </div>
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                      <Button type="submit">Assign Task</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
             <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    {renderTaskList(pendingTasks)}
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    {renderTaskList(completedTasks)}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
