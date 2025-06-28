
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
});

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state and refs for camera functionality
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  // Effect to handle camera stream
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
    // Cleanup function to stop stream when camera is closed
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [isCameraOpen, stream]);

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

  const handleOpenCamera = async () => {
    // Stop any existing stream
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(newStream);
        setIsCameraOpen(true);
    } catch (err) {
        console.error("Camera access error:", err);
        toast({
            variant: 'destructive',
            title: 'Camera Error',
            description: 'Could not access the camera. Please check your browser permissions for this site.'
        });
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const timestamp = new Date().toLocaleString();

    const drawOverlay = (geoString: string | null) => {
        ctx.font = '24px "PT Sans", sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round'; // For better looking text borders

        const timestampY = geoString ? canvas.height - 50 : canvas.height - 20;
        const geoStringY = canvas.height - 20;
        const textX = 20;

        ctx.strokeText(timestamp, textX, timestampY);
        ctx.fillText(timestamp, textX, timestampY);
        
        if (geoString) {
            ctx.strokeText(geoString, textX, geoStringY);
            ctx.fillText(geoString, textX, geoStringY);
        }

        form.setValue('completionPhotoUri', canvas.toDataURL('image/jpeg'));
        form.clearErrors('completionPhotoUri');
        
        // Stop the stream and close the camera dialog
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setIsCameraOpen(false);
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const geoString = `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
                drawOverlay(geoString);
            },
            (error) => {
                toast({
                    variant: 'destructive',
                    title: 'Location Error',
                    description: 'Could not get location. Photo will be saved without it.'
                });
                drawOverlay(null); // Proceed without location
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        toast({ variant: 'destructive', title: 'Location Error', description: 'Geolocation is not supported by this browser.' });
        drawOverlay(null);
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
      {/* Hidden canvas for photo processing */}
      <canvas ref={canvasRef} className="hidden" />

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
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                          <Button type="button" variant="outline" onClick={handleOpenCamera}>
                                              <Camera className="mr-2 h-4 w-4" /> Use Camera
                                          </Button>
                                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                              <FileUp className="mr-2 h-4 w-4" /> Upload File
                                          </Button>
                                          <Input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                      </div>
                                       {field.value ? (
                                            <div className="mt-2 text-sm flex items-center gap-2">
                                                <Image src={field.value} alt="Preview" width={48} height={48} className="rounded-md border" />
                                                <span>Photo attached.</span>
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
                    <Button type="submit">Submit Completion</Button>
                </DialogFooter>
                </form>
            </Form>
            </DialogContent>
        </Dialog>

        {/* Camera Modal */}
        <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
            <DialogContent className="max-w-3xl p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Take Verification Photo</DialogTitle>
                    <DialogDescription>
                        Position the subject in the frame and capture the image. The time and GPS coordinates will be stamped on the photo.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative p-6 pt-2">
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                </div>
                <DialogFooter className="p-6 pt-0">
                    <Button type="button" onClick={handleCapturePhoto} className="w-full">
                        <Camera className="mr-2 h-4 w-4" /> Capture Photo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
