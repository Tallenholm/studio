
'use client';

import { useState, useRef, useEffect } from 'react';
import type { Control } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { InspectionItem, InspectionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Camera, Trash2, Loader2, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { uploadFile } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ChecklistItemProps {
  item: InspectionItem;
  control: Control<any>; 
  fieldNamePrefix: string; 
  currentStatus: InspectionStatus;
}

export default function ChecklistItemComponent({ item, control, fieldNamePrefix, currentStatus }: ChecklistItemProps) {
  const getStatusColor = (status: InspectionStatus) => {
    if (status === 'pass') return 'border-green-500 bg-green-500/10';
    if (status === 'fail') return 'border-red-500 bg-red-500/10';
    return 'border-border';
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    // Cleanup camera stream
    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [stream]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, field: { onChange: (value: string) => void }) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const path = `inspections/${Date.now()}-${file.name}`;
        const downloadUrl = await uploadFile(file, path);
        field.onChange(downloadUrl);
        toast({ title: 'Success', description: 'Photo uploaded successfully.' });
      } catch (error) {
        console.error('File upload error:', error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the photo.' });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleOpenCamera = async () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(newStream);
        setIsCameraOpen(true);
    } catch (err) {
        toast({ variant: 'destructive', title: 'Camera Error', description: 'Could not access camera. Please check permissions.' });
    }
  };

  useEffect(() => {
    if(isCameraOpen && stream && videoRef.current) {
        videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const handleCapturePhoto = (onChange: (value: string) => void) => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    setIsUploading(true);
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        return uploadFile(file, `inspections/${file.name}`);
      })
      .then(url => {
        onChange(url);
        toast({ title: 'Photo Captured', description: 'Photo attached to the inspection item.' });
      })
      .catch(error => {
        console.error("Inspection photo capture error:", error);
        toast({ variant: 'destructive', title: 'Capture Failed', description: 'Could not save the captured photo.' });
      })
      .finally(() => {
        setIsUploading(false);
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setIsCameraOpen(false);
      });
  };

  return (
    <>
    <canvas ref={canvasRef} className="hidden" />
    <div className={cn("p-4 rounded-lg border transition-all duration-300", getStatusColor(currentStatus))}>
      <div className="flex items-center gap-2">
        <item.Icon className={cn("h-6 w-6 shrink-0",
          currentStatus === 'pass' ? 'text-green-600' :
          currentStatus === 'fail' ? 'text-red-600' : 'text-primary'
        )} />
        <span className="font-medium text-lg">{item.name}</span>
      </div>

      <div className="pl-8">
        <p className="text-sm text-muted-foreground mt-1 mb-3">{item.instructions}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-4">
            <FormField
              control={control}
              name={`${fieldNamePrefix}.status`}
              render={({ field }) => (
                <FormItem>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4 pt-2"
                    aria-label={`Status for ${item.name}`}
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="pass" id={`${item.id}-pass`} />
                      </FormControl>
                      <FormLabel htmlFor={`${item.id}-pass`} className="font-normal text-green-700 cursor-pointer">
                        Pass
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="fail" id={`${item.id}-fail`} />
                      </FormControl>
                      <FormLabel htmlFor={`${item.id}-fail`} className="font-normal text-red-700 cursor-pointer">
                        Fail
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`${fieldNamePrefix}.notes`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Notes (Required if Fail)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue or add optional notes..."
                      {...field}
                      className="bg-card"
                      aria-label={`Notes for ${item.name}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-2 md:mt-0">
            <FormField
              control={control}
              name={`${fieldNamePrefix}.photoUrl`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Photo Evidence</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileChange(e, field)}
                        aria-label={`Upload photo for ${item.name}`}
                        disabled={isUploading}
                      />
                      {!field.value ? (
                        <div className="flex gap-2">
                           <Button type="button" variant="outline" onClick={handleOpenCamera} disabled={isUploading}><Camera className="mr-2 h-4 w-4" />Camera</Button>
                           <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><FileUp className="mr-2 h-4 w-4" />Upload</Button>
                        </div>
                      ) : (
                        <div className="relative w-32 h-32">
                          <Image
                            src={field.value}
                            alt={`Preview for ${item.name}`}
                            fill
                            sizes="128px"
                            className="object-cover rounded-md border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg"
                            onClick={() => field.onChange('')}
                            aria-label={`Remove photo for ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
     <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Take Verification Photo</DialogTitle></DialogHeader>
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay playsInline />
            <DialogFooter>
                 <FormField
                    control={control}
                    name={`${fieldNamePrefix}.photoUrl`}
                    render={({ field }) => (
                         <Button type="button" onClick={() => handleCapturePhoto(field.onChange)} className="w-full"><Camera className="mr-2 h-4 w-4"/>Capture</Button>
                    )}
                 />
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
