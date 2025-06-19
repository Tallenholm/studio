'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CHECKLIST_DATA } from '@/lib/data';
import type { InspectionReport, VehicleVins, InspectionStatus, CompletedInspectionItem, ChecklistSectionData } from '@/lib/types';
import ChecklistItemComponent from './ChecklistItemComponent';
import { saveInspectionReport, loadVins } from '@/lib/localStorageService';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

const completedItemSchema = z.object({
  itemId: z.string(),
  name: z.string(),
  status: z.enum(['pass', 'fail', 'pending']),
  notes: z.string().optional(),
});

const sectionSchema = z.object({
  vehicleType: z.enum(['truck', 'trailer', 'skidSteer']),
  name: z.string(),
  items: z.array(completedItemSchema),
});

const inspectionFormSchema = z.object({
  sections: z.array(sectionSchema),
}).superRefine((data, ctx) => {
  data.sections.forEach((section, sectionIndex) => {
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
  });
});

type InspectionFormValues = z.infer<typeof inspectionFormSchema>;

interface InspectionFormProps {
  inspectionType: 'pre-trip' | 'post-trip';
}

export default function InspectionFormComponent({ inspectionType }: InspectionFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [vins, setVins] = useState<VehicleVins | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setVins(loadVins());
  }, []);
  
  const defaultValues: InspectionFormValues = {
    sections: CHECKLIST_DATA.map(section => ({
      vehicleType: section.id,
      name: section.name,
      items: section.items.map(item => ({
        itemId: item.id,
        name: item.name,
        status: 'pending' as InspectionStatus,
        notes: '',
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

  async function onSubmit(values: InspectionFormValues) {
    setIsSubmitting(true);
    const reportId = `${inspectionType}-${Date.now()}`;
    
    let overallStatus: 'pass' | 'fail' = 'pass';
    values.sections.forEach(section => {
      section.items.forEach(item => {
        if (item.status === 'fail') {
          overallStatus = 'fail';
        }
      });
    });

    const report: InspectionReport = {
      id: reportId,
      type: inspectionType,
      date: new Date().toISOString(),
      truckVin: vins?.truckVin,
      trailerVin: vins?.trailerVin,
      skidSteerVin: vins?.skidSteerVin,
      sections: values.sections.map(section => ({
        vehicleType: section.vehicleType,
        name: section.name,
        items: section.items.map(item => ({
          itemId: item.itemId,
          name: item.name,
          status: item.status,
          notes: item.notes,
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
          Complete the checklist for all vehicles and equipment. 
          VINs loaded: Truck: <span className="font-medium text-foreground">{vins?.truckVin || 'N/A'}</span>, 
          Trailer: <span className="font-medium text-foreground">{vins?.trailerVin || 'N/A'}</span>, 
          Skid Steer: <span className="font-medium text-foreground">{vins?.skidSteerVin || 'N/A'}</span>.
          {!vins?.truckVin && !vins?.trailerVin && !vins?.skidSteerVin && 
            <span className="text-accent"> (No VINs entered. Please visit VIN Entry page.)</span>
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue={CHECKLIST_DATA[0].id} className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
                {CHECKLIST_DATA.map(section => (
                  <TabsTrigger key={section.id} value={section.id} className="text-base py-3 data-[state=active]:shadow-md">
                    <section.Icon className="mr-2 h-5 w-5" /> {section.name.split('(')[0].trim()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {fields.map((sectionField, sectionIndex) => (
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
              ))}
            </Tabs>

            <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || (!vins?.truckVin && !vins?.trailerVin && !vins?.skidSteerVin)} aria-label="Submit Inspection">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Inspection'}
            </Button>
             {form.formState.errors.sections && (
                <p className="text-sm font-medium text-destructive mt-2 text-center">Please ensure all items are marked and notes are provided for failed items.</p>
            )}
            {(!vins?.truckVin && !vins?.trailerVin && !vins?.skidSteerVin) &&
                 <p className="text-sm font-medium text-accent mt-2 text-center">Please enter at least one VIN on the VIN Entry page to submit an inspection.</p>
            }
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
