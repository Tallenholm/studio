
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CHECKLIST_DATA } from '@/lib/data';
import type { InspectionReport, InspectionStatus, FleetAsset, VehicleType } from '@/lib/types';
import ChecklistItemComponent from './ChecklistItemComponent';
import { saveInspectionReport, loadFleetAssets } from '@/lib/localStorageService';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, Send, Truck, Box, Construction, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const completedItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  status: z.enum(['pass', 'fail', 'pending']),
  notes: z.string().optional(),
  photoDataUri: z.string().optional(),
});

const sectionSchema = z.object({
  vehicleType: z.enum(['truck', 'trailer', 'skidSteer']),
  name: z.string(),
  items: z.array(completedItemSchema),
});

const inspectionFormSchema = z.object({
  truckVin: z.string().optional(),
  trailerVin: z.string().optional(),
  skidSteerVin: z.string().optional(),
  sections: z.array(sectionSchema),
}).superRefine((data, ctx) => {
  if (!data.truckVin && !data.trailerVin && !data.skidSteerVin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'You must select at least one vehicle for the inspection.',
      path: ['truckVin'],
    });
  }

  data.sections.forEach((section, sectionIndex) => {
    const isTruckSection = section.vehicleType === 'truck' && data.truckVin;
    const isTrailerSection = section.vehicleType === 'trailer' && data.trailerVin;
    const isSkidSteerSection = section.vehicleType === 'skidSteer' && data.skidSteerVin;

    // Only validate sections for selected vehicles
    if (isTruckSection || isTrailerSection || isSkidSteerSection) {
        section.items.forEach((item, itemIndex) => {
        if (item.status === 'fail' && (!item.notes || item.notes.trim() === '')) {
            ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Notes are required if status is Fail.',
            path: ['sections', sectionIndex, 'items', itemIndex, 'notes'],
            });
        }
        if (item.status === 'pending') {
            ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please select Pass or Fail.',
            path: ['sections', sectionIndex, 'items', itemIndex, 'status'],
            });
        }
        });
    }
  });
});

type InspectionFormValues = z.infer<typeof inspectionFormSchema>;

interface InspectionFormProps {
  inspectionType: 'pre-trip' | 'post-trip';
}

export default function InspectionFormComponent({ inspectionType }: InspectionFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [fleetAssets, setFleetAssets] = useState<FleetAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setFleetAssets(loadFleetAssets());
  }, []);
  
  const { trucks, trailers, skidSteers } = useMemo(() => {
    return {
      trucks: fleetAssets.filter(a => a.type === 'truck'),
      trailers: fleetAssets.filter(a => a.type === 'trailer'),
      skidSteers: fleetAssets.filter(a => a.type === 'skidSteer'),
    }
  }, [fleetAssets]);

  const defaultValues: InspectionFormValues = {
    truckVin: '',
    trailerVin: '',
    skidSteerVin: '',
    sections: CHECKLIST_DATA.map(section => ({
      vehicleType: section.id,
      name: section.name,
      items: section.items.map(item => ({
        itemId: item.id,
        name: item.name,
        status: 'pending' as InspectionStatus,
        notes: '',
        photoDataUri: '',
      })),
    })),
  };

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'sections',
  });

  const watchedSections = form.watch('sections');
  const watchedTruckVin = form.watch('truckVin');
  const watchedTrailerVin = form.watch('trailerVin');
  const watchedSkidSteerVin = form.watch('skidSteerVin');

  const visibleSections = useMemo(() => {
    return CHECKLIST_DATA.filter(section => {
        if (section.id === 'truck') return !!watchedTruckVin;
        if (section.id === 'trailer') return !!watchedTrailerVin;
        if (section.id === 'skidSteer') return !!watchedSkidSteerVin;
        return false;
    });
  }, [watchedTruckVin, watchedTrailerVin, watchedSkidSteerVin]);

  async function onSubmit(values: InspectionFormValues) {
    setIsSubmitting(true);
    
    const filteredSections = values.sections.filter(section => {
      if (section.vehicleType === 'truck') return !!values.truckVin;
      if (section.vehicleType === 'trailer') return !!values.trailerVin;
      if (section.vehicleType === 'skidSteer') return !!values.skidSteerVin;
      return false;
    });

    let overallStatus: 'pass' | 'fail' = 'pass';
    filteredSections.forEach(section => {
      section.items.forEach(item => {
        if (item.status === 'fail') {
          overallStatus = 'fail';
        }
      });
    });

    const reportId = `${inspectionType}-${Date.now()}`;
    const report: InspectionReport = {
      id: reportId,
      type: inspectionType,
      date: new Date().toISOString(),
      employeeId: user?.id,
      employeeName: user?.name,
      truckVin: values.truckVin,
      trailerVin: values.trailerVin,
      skidSteerVin: values.skidSteerVin,
      sections: filteredSections.map(section => ({
        vehicleType: section.vehicleType,
        name: section.name,
        items: section.items.map(item => ({
          itemId: item.itemId,
          name: item.name,
          status: item.status,
          notes: item.notes,
          photoDataUri: item.photoDataUri,
        })),
      })),
      overallStatus,
    };

    await new Promise(resolve => setTimeout(resolve, 1000));

    saveInspectionReport(report);
    toast({
      title: `${inspectionType === 'pre-trip' ? 'Pre-Trip' : 'Post-Trip'} Inspection Submitted`,
      description: 'Your inspection report has been saved.',
    });
    setIsSubmitting(false);
    router.push(`/reports/${reportId}${inspectionType === 'pre-trip' ? '?analyze=true' : ''}`);
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Inspection Form...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="text-3xl font-headline capitalize">
          {inspectionType.replace('-', ' ')} Inspection
        </CardTitle>
        <CardDescription>
          Select the vehicle(s) for this inspection, then complete the checklist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <div className="p-6 border rounded-lg shadow-sm bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">Select Vehicles</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <FormField
                        control={form.control}
                        name="truckVin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-lg"><Truck className="h-5 w-5 text-primary"/>Truck</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={trucks.length === 0}>
                              <SelectTrigger>
                                <SelectValue placeholder={trucks.length > 0 ? "Select a truck" : "No trucks in fleet"} />
                              </SelectTrigger>
                              <SelectContent>
                                {trucks.map(truck => <SelectItem key={truck.id} value={truck.vin}>{truck.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="trailerVin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-lg"><Box className="h-5 w-5 text-primary"/>Trailer</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={trailers.length === 0}>
                              <SelectTrigger>
                                <SelectValue placeholder={trailers.length > 0 ? "Select a trailer" : "No trailers in fleet"} />
                              </SelectTrigger>
                              <SelectContent>
                                {trailers.map(trailer => <SelectItem key={trailer.id} value={trailer.vin}>{trailer.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="skidSteerVin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-lg"><Construction className="h-5 w-5 text-primary"/>Skid Steer</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={skidSteers.length === 0}>
                              <SelectTrigger>
                                <SelectValue placeholder={skidSteers.length > 0 ? "Select a skid steer" : "No skid steers in fleet"} />
                              </SelectTrigger>
                              <SelectContent>
                                {skidSteers.map(skidSteer => <SelectItem key={skidSteer.id} value={skidSteer.vin}>{skidSteer.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                 </div>
                 {form.formState.errors.truckVin && (
                    <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.truckVin.message}</p>
                )}
            </div>

            {visibleSections.length > 0 ? (
                <Tabs defaultValue={visibleSections[0].id} className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                    {visibleSections.map(section => (
                    <TabsTrigger key={section.id} value={section.id} className="text-base py-3 data-[state=active]:shadow-md">
                        <section.Icon className="mr-2 h-5 w-5" /> {section.name.split('(')[0].trim()}
                    </TabsTrigger>
                    ))}
                </TabsList>
                {fields.map((sectionField, sectionIndex) => {
                    const isVisible = visibleSections.some(s => s.id === sectionField.vehicleType);
                    if (!isVisible) return null;

                    return (
                        <TabsContent key={sectionField.id} value={sectionField.vehicleType}>
                        <div className="space-y-4 mt-6">
                            {sectionField.items.map((itemField, itemIndex) => {
                            const originalItem = CHECKLIST_DATA[sectionIndex].items[itemIndex];
                            const currentStatus = watchedSections[sectionIndex]?.items[itemIndex]?.status || 'pending';
                            return (
                                <ChecklistItemComponent
                                key={itemField.itemId}
                                item={originalItem}
                                control={form.control}
                                fieldNamePrefix={`sections.${sectionIndex}.items.${itemIndex}`}
                                currentStatus={currentStatus}
                                />
                            );
                            })}
                        </div>
                        </TabsContent>
                    );
                })}
                </Tabs>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg flex flex-col items-center gap-4">
                    <ClipboardList className="h-12 w-12 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">Please select a vehicle to begin the inspection.</p>
                </div>
            )}
            
            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || visibleSections.length === 0} aria-label="Submit Inspection">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
            </Button>
             {form.formState.errors.sections && (
                <p className="text-sm font-medium text-destructive mt-2 text-center">Please ensure all checklist items are marked and notes are provided for failed items.</p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    