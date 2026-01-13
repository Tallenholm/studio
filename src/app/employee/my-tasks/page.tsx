
'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateTask, getTasks } from '@/lib/firestoreService';
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
import { useUser, uploadFile } from '@/firebase/provider';
import { ClipboardList, Loader2, CheckCircle2, Camera, FileUp, Eye } from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

const completeTaskSchema = z.object({
  completionNotes: z.string().optional(),
  completionPhotoUrl: z.string().optional(),
});


export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const { toast } = useToast();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraView, setIsCameraView] = useState(false);

  const form = useForm<z.infer<typeof completeTaskSchema>>({
    resolver: zodResolver(completeTaskSchema),
  });

  useEffect(() => {
    async function fetchTasks() {
        if (!user) return;
        setIsLoading(true);
        try {
            const allTasks = await getTasks();
            const userTasks = allTasks
                .filter(t => t.assignedToEmployeeId === user.uid)
                .sort((a, b) => new Date(b.dateAssigned).getTime() - new Date(a.dateAssigned).getTime());
            setTasks(userTasks);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your tasks.' });
        } finally {
            setIsLoading(false);
        }
    }
    fetchTasks();
  }, [user, toast]);

  useEffect(() => {
    // Cleanup camera stream
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [stream]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
        setIsProcessingFile(true);
        try {
            const path = `task_completions/${user.uid}/${Date.now()}-${file.name}`;
            const url = await uploadFile(file, path);
            form.setValue('completionPhotoUrl', url);
            form.clearErrors('completionPhotoUrl');
            toast({ title: 'Photo Uploaded', description: 'Your photo has been attached.' });
        } catch (error) {
            console.error("Task photo upload error:", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the photo.' });
        } finally {
            setIsProcessingFile(false);
        }
    }
  };

  const handleOpenCamera = async () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(newStream);
        setIsCameraView(true);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access camera. Please check permissions.' });
    }
  };

  useEffect(() => {
    if(isCameraView && stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
  }, [isCameraView, stream]);

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    setIsProcessingFile(true);
    // Convert data URL to blob to upload
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        return uploadFile(file, `task_completions/${user?.uid}/${file.name}`);
      })
      .then(url => {
        form.setValue('completionPhotoUrl', url);
        form.clearErrors('completionPhotoUrl');
        toast({ title: 'Photo Captured', description: 'Your photo has been attached.' });
      })
      .catch(error => {
        console.error("Task photo capture error:", error);
        toast({ variant: 'destructive', title: 'Capture Failed', description: 'Could not save the captured photo.' });
      })
      .finally(() => {
        setIsProcessingFile(false);
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsCameraView(false);
      });
  };

  async function onCompleteSubmit(values: z.infer<typeof completeTaskSchema>) {
    if (!selectedTask) return;

    if (selectedTask.requiresPhoto && !values.completionPhotoUrl) {
        form.setError('completionPhotoUrl', { message: 'A photo is required for this task.' });
        return;
    }

    const updatedTaskData: Partial<Task> = {
        status: 'completed',
        dateCompleted: new Date().toISOString(),
        completionNotes: values.completionNotes,
        completionPhotoUrl: values.completionPhotoUrl,
    };

    await updateTask(selectedTask.id, updatedTaskData);
    
    setTasks(tasks.map(t => t.id === selectedTask.id ? { ...t, ...updatedTaskData } as Task : t));

    toast({ title: 'Task Completed', description: `"${selectedTask.title}" marked as complete.` });
    setIsDialogOpen(false);
    setSelectedTask(null);
    form.reset();
  }

  const openCompleteDialog = (task: Task) => {
    setSelectedTask(task);
    form.reset({ completionNotes: '', completionPhotoUrl: '' });
    setIsCameraView(false);
    setIsDialogOpen(true);
  }
  
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Your Tasks...</p>
      </div>
    );
  }

  return (
    <>
    <canvas ref={canvasRef} className="hidden" />
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
                            <p className="text-sm text-muted-foreground">Assigned {formatDistanceToNow(parseISO(task.dateAssigned), { addSuffix: true })} by {task.createdByAdminName}</p>
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
                            <p className="text-sm text-muted-foreground">Completed: {task.dateCompleted ? format(parseISO(task.dateCompleted), 'PPp') : 'N/A'}</p>
                        </div>
                        <Badge variant="default" className="bg-green-600">Completed</Badge>
                    </div>
                    {task.completionNotes && <p className="text-sm mt-2 bg-background/50 p-2 rounded-md"><strong>Your Notes:</strong> {task.completionNotes}</p>}
                    {task.completionPhotoUrl && (
                        <div className="mt-2">
                             <Image
                                src={task.completionPhotoUrl}
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
            <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>Complete Task: {selectedTask?.title}</DialogTitle>
                <DialogDescription>
                  {isCameraView ? "Point your camera at the subject and click capture." : "Provide any notes and upload a photo if required to complete this task."}
                </DialogDescription>
            </DialogHeader>

            {isCameraView ? (
                <div>
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline />
                  <Button type="button" onClick={handleCapturePhoto} className="w-full mt-4" disabled={isProcessingFile}>
                    {isProcessingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4"/>}
                    {isProcessingFile ? 'Processing...' : 'Capture'}
                  </Button>
                </div>
            ) : (
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
                                name="completionPhotoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Verification Photo (Required)</FormLabel>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                              <Button type="button" variant="outline" onClick={handleOpenCamera} disabled={isProcessingFile}><Camera className="mr-2 h-4 w-4" />Use Camera</Button>
                                              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessingFile}><FileUp className="mr-2 h-4 w-4" />Upload</Button>
                                              <Input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} disabled={isProcessingFile}/>
                                          </div>
                                           {field.value && !isProcessingFile ? (
                                                <div className="mt-2 text-sm flex items-center gap-2">
                                                    <Image src={field.value} alt="Preview" width={48} height={48} className="rounded-md border" />
                                                    <span>Photo attached.</span>
                                                </div>
                                            ) : isProcessingFile ? (
                                                <div className="mt-2 text-sm flex items-center gap-2 text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>Processing...</span>
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                                                   <Camera className="h-4 w-4" />
                                                    <span>No photo attached.</span>
                                                </div>
                                            )}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                    <DialogFooter>
                        <Button type="submit" disabled={isProcessingFile}>Submit Completion</Button>
                    </DialogFooter>
                    </form>
                </Form>
            )}
            </DialogContent>
        </Dialog>
    </div>
    </>
  );
}
