
'use client';

import { useState, useRef } from 'react';
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
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { uploadFile } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItemProps {
  item: InspectionItem;
  control: Control<any>; // Control from react-hook-form
  fieldNamePrefix: string; // e.g., "sections.0.items.0"
  currentStatus: InspectionStatus;
}

export default function ChecklistItemComponent({ item, control, fieldNamePrefix, currentStatus }: ChecklistItemProps) {
  const getStatusColor = (status: InspectionStatus) => {
    if (status === 'pass') return 'border-green-500 bg-green-500/10';
    if (status === 'fail') return 'border-red-500 bg-red-500/10';
    return 'border-border';
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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

  return (
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
          {/* Column 1: Status and Notes */}
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

          {/* Column 2: Photo Upload */}
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
                        capture="environment"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleFileChange(e, field)}
                        aria-label={`Upload photo for ${item.name}`}
                        disabled={isUploading}
                      />
                      {!field.value ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full md:w-auto"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                          {isUploading ? 'Uploading...' : 'Add Photo'}
                        </Button>
                      ) : (
                        <div className="relative w-32 h-32">
                          <Image
                            src={field.value}
                            alt={`Preview for ${item.name}`}
                            fill
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
  );
}
