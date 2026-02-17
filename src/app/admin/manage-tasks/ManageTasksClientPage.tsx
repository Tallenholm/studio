'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addTask, deleteTask, updateTask } from '@/lib/firestoreService';
import type { Task, User } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { PlusCircle, Trash2, Eye, Loader2, MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required.'),
  description: z.string().min(1, 'Description is required.'),
  assignedToEmployeeId: z.string({ required_error: 'Please assign this task to an employee.' }),
  requiresPhoto: z.boolean().default(false),
});

interface ManageTasksClientPageProps {
  initialUsers: User[];
  initialPendingTasks: Task[];
  initialCompletedTasks: Task[];
}

export default function ManageTasksClientPage({ initialUsers, initialPendingTasks, initialCompletedTasks }: ManageTasksClientPageProps) {
  const [users] = useState<User[]>(initialUsers);
  const [pendingTasks, setPendingTasks] = useState<Task[]>(initialPendingTasks);
  const [completedTasks, setCompletedTasks] = useState<Task[]>(initialCompletedTasks);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
        title: '',
        description: '',
        requiresPhoto: false,
    },
  });

  const employeeOptions = useMemo(() => users.filter(u => u.role === 'employee'), [users]);

  async function onSubmit(values: z.infer<typeof taskSchema>) {
    if (!user) return;
    const assignedEmployee = users.find(u => u.id === values.assignedToEmployeeId);
    if (!assignedEmployee) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected employee not found.' });
        return;
    }
    
    const newTaskData: Omit<Task, 'id' | 'dateCompleted' | 'status'| 'assignedToEmployeeName' | 'createdByAdminName' | 'dateAssigned'> = {
        ...values,
    };

    const newId = await addTask({ ...newTaskData, status: 'pending', dateCompleted: null, assignedToEmployeeName: assignedEmployee.name, createdByAdminName: user.name, dateAssigned: new Date().toISOString() });
    setPendingTasks(prev => [{ id: newId, ...newTaskData, status: 'pending', dateCompleted: null, assignedToEmployeeName: assignedEmployee.name, createdByAdminName: user.name, dateAssigned: new Date().toISOString() }, ...prev].sort((a,b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime()));
    
    toast({ title: 'Task Created', description: `Task "${values.title}" assigned to ${assignedEmployee.name}.` });
    setIsDialogOpen(false);
    form.reset();
  }

  async function removeTask(taskId: string) {
    const taskToRemove = [...pendingTasks, ...completedTasks].find(t => t.id === taskId);
    await deleteTask(taskId);
    setPendingTasks(prev => prev.filter(t => t.id !== taskId));
    setCompletedTasks(prev => prev.filter(t => t.id !== taskId));
    toast({ title: 'Task Deleted', description: `Task "${taskToRemove?.title}" has been deleted.`, variant: 'destructive' });
  }

  const renderTaskTable = (tasks: Task[]) => (
    <div className="border rounded-md bg-card">
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date Assigned</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {tasks.map(task => (
                <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.assignedToEmployeeName}</TableCell>
                <TableCell>{format(parseISO(task.dateAssigned), 'PP')}</TableCell>
                <TableCell>{task.dateCompleted ? format(parseISO(task.dateCompleted), 'PPp') : '---'}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {task.status === 'completed' && <DropdownMenuItem onSelect={() => setViewingTask(task)}><Eye className="mr-2 h-4 w-4" />View Completion</DropdownMenuItem>}
                            <DropdownMenuItem onSelect={() => setTaskToDelete(task)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    </div>
  );

  return (
    <>
      <div className="container mx-auto py-8">
        <PageHeader title="Manage Tasks" description="Assign and track one-off tasks for employees." icon={PlusCircle}>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" />New Task</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Task</DialogTitle>
                        <DialogDescription>Assign a task to an employee. They will be notified.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Clean truck cab" /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Add specific instructions for the task." /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="assignedToEmployeeId" render={({ field }) => (
                                <FormItem><FormLabel>Assign To</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select an employee..." /></SelectTrigger></FormControl>
                                    <SelectContent>{employeeOptions.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="requiresPhoto" render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none"><FormLabel>Require photo verification</FormLabel><FormDescription>If checked, the employee must upload a photo to complete the task.</FormDescription></div>
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <Button type="submit">Assign Task</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </PageHeader>

        <div className="mt-8">
            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    {pendingTasks.length > 0 ? renderTaskTable(pendingTasks) : <EmptyState icon={PlusCircle} title="No Pending Tasks" />}
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    {completedTasks.length > 0 ? renderTaskTable(completedTasks) : <EmptyState icon={PlusCircle} title="No Completed Tasks" />}
                </TabsContent>
            </Tabs>
        </div>

      </div>

      {/* View Task Details Dialog */}
      <Dialog open={!!viewingTask} onOpenChange={() => setViewingTask(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Task Completion Details</DialogTitle>
                <DialogDescription>For task: "{viewingTask?.title}"</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <p><strong>Completed By:</strong> {viewingTask?.assignedToEmployeeName}</p>
                {viewingTask?.dateCompleted && <p><strong>Date:</strong> {format(parseISO(viewingTask.dateCompleted), 'PPpp')}</p>}
                {viewingTask?.completionNotes && <p><strong>Notes:</strong> {viewingTask.completionNotes}</p>}
                {viewingTask?.completionPhotoUrl ? (
                    <div>
                        <p className="font-semibold mb-2">Verification Photo:</p>
                        <Image src={viewingTask.completionPhotoUrl} alt="Task verification" width={400} height={400} className="rounded-md border object-cover" />
                    </div>
                ) : (
                    <p>No photo was submitted for this task.</p>
                )}
            </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the task "{taskToDelete?.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if(taskToDelete) removeTask(taskToDelete.id) }} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
