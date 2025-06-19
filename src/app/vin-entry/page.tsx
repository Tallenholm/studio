'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { loadVins, saveVins } from '@/lib/localStorageService';
import type { VehicleVins } from '@/lib/types';
import { Truck, Box, Construction, Save } from 'lucide-react';

const vinSchema = z.object({
  truckVin: z.string().min(1, 'Truck VIN is required').max(17, 'VIN must be 17 characters').optional().or(z.literal('')),
  trailerVin: z.string().min(1, 'Trailer VIN is required').max(17, 'VIN must be 17 characters').optional().or(z.literal('')),
  skidSteerVin: z.string().min(1, 'Skid Steer VIN is required').max(17, 'VIN must be 17 characters').optional().or(z.literal('')),
});

export default function VinEntryPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<z.infer<typeof vinSchema>>({
    resolver: zodResolver(vinSchema),
    defaultValues: {
      truckVin: '',
      trailerVin: '',
      skidSteerVin: '',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    const storedVins = loadVins();
    if (storedVins) {
      form.reset(storedVins);
    }
  }, [form]);

  function onSubmit(values: z.infer<typeof vinSchema>) {
    saveVins(values);
    toast({
      title: 'VINs Saved',
      description: 'Vehicle Identification Numbers have been successfully saved.',
      variant: 'default',
    });
  }

  if (!isMounted) {
    return <div className="flex justify-center items-center h-full"><p>Loading VINs...</p></div>; // Or a Skeleton loader
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            <Edit3 className="h-8 w-8 text-primary" />
            Vehicle Identification Numbers
          </CardTitle>
          <CardDescription>
            Enter and save the VINs for your truck, trailer, and skid steer. 
            These will be used for inspections and reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="truckVin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-lg"><Truck className="h-5 w-5 text-primary" />Truck VIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 17-character Truck VIN" {...field} aria-label="Truck VIN" />
                    </FormControl>
                    <FormDescription>
                      VIN for your 2021 Chevy 6500 dump bed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="trailerVin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-lg"><Box className="h-5 w-5 text-primary" />Trailer VIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 17-character Trailer VIN" {...field} aria-label="Trailer VIN" />
                    </FormControl>
                    <FormDescription>
                      VIN for your tilt deck trailer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="skidSteerVin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-lg"><Construction className="h-5 w-5 text-primary" />Skid Steer VIN/Serial</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Skid Steer VIN or Serial Number" {...field} aria-label="Skid Steer VIN or Serial Number" />
                    </FormControl>
                    <FormDescription>
                      VIN or Serial Number for your skid steer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-lg py-6" aria-label="Save VINs">
                <Save className="mr-2 h-5 w-5" /> Save VINs
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
