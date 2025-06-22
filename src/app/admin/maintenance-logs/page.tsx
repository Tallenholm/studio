
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadFleetAssets, loadMaintenanceLogs, saveMaintenanceLogs } from '@/lib/localStorageService';
import type { FleetAsset, MaintenanceLog } from '@/lib/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Wrench, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const logSchema = z.object({
  assetId: z.string({ required_error: 'Please select an asset.' }),
  date: z.date({ required_error: 'A date is required.' }),
  serviceType: z.enum(['routine', 'repair', 'inspection', 'other'], { required_error: 'Service type is required.' }),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  cost: z.coerce.number().optional(),
  mechanic: z.string().optional(),
});

export default function MaintenanceLogsPage() {
  const [assets, setAssets] = useState<FleetAsset[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      serviceType: 'routine',
      description: '',
      mechanic: 'In-house',
    },
  });

  useEffect(() => {
    setIsMounted(true);
    setAssets(loadFleetAssets());
    setLogs(loadMaintenanceLogs().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  useEffect(() => {
    if (isMounted) {
      saveMaintenanceLogs(logs);
    }
  }, [logs, isMounted]);

  function onSubmit(values: z.infer<typeof logSchema>) {
    const asset = assets.find(a => a.id === values.assetId);
    if (!asset) {
        toast({ variant: 'destructive', title: 'Error', description: 'Selected asset not found.' });
        return;
    }

    const newLog: MaintenanceLog = {
      id: `log-${Date.now()}`,
      assetId: asset.id,
      assetName: asset.name,
      date: values.date.toISOString().split('T')[0],
      cost: values.cost,
      mechanic: values.mechanic,
      ...values,
    };
    setLogs(prev => [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    toast({ title: 'Maintenance Logged', description: `Service for ${asset.name} has been recorded.` });
    setIsDialogOpen(false);
    form.reset({ serviceType: 'routine', description: '', mechanic: 'In-house', cost: undefined, assetId: undefined });
  }

  function removeLog(logId: string) {
    const logToRemove = logs.find(v => v.id === logId);
    setLogs(prev => prev.filter(v => v.id !== logId));
    toast({
      title: 'Log Removed',
      description: `The maintenance log for ${logToRemove?.assetName} has been deleted.`,
      variant: 'destructive',
    });
  }

  const getServiceTypeLabel = (type: MaintenanceLog['serviceType']) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Maintenance Records...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-card/90 backdrop-blur-xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                <Wrench className="h-8 w-8 text-primary" />
                Fleet Maintenance Logs
              </CardTitle>
              <CardDescription className="mt-2">
                Log, view, and manage service history for all fleet assets.
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Log New Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Log New Maintenance</DialogTitle>
                  <DialogDescription>
                    Fill out the details for the service performed. This record is for internal use.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name="assetId"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Asset</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select an asset" />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  {assets.map(asset => (
                                      <SelectItem key={asset.id} value={asset.id}>
                                          {asset.name}
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
                          name="date"
                          render={({ field }) => (
                              <FormItem className="flex flex-col">
                              <FormLabel>Date of Service</FormLabel>
                              <Popover>
                                  <PopoverTrigger asChild>
                                  <FormControl>
                                      <Button
                                      variant={"outline"}
                                      className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                      )}
                                      >
                                      {field.value ? (
                                          format(field.value, "PPP")
                                      ) : (
                                          <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                  </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                  />
                                  </PopoverContent>
                              </Popover>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                    </div>
                     <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Select a service type" />
                              </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                  <SelectItem value="routine">Routine Service</SelectItem>
                                  <SelectItem value="repair">Repair</SelectItem>
                                  <SelectItem value="inspection">Inspection</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                          </Select>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Service</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Provide a detailed description of the work performed." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="cost"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Cost (Optional)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 150.50" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mechanic"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Mechanic / Service Provider (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., In-house, City Auto" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                    <DialogFooter>
                      <Button type="submit">Save Log</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
            <Card>
                <CardHeader>
                    <CardTitle>Service History</CardTitle>
                </CardHeader>
                <CardContent>
                    {logs.length > 0 ? (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Cost</TableHead>
                                    <TableHead>Mechanic</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="font-medium">{log.assetName}</TableCell>
                                        <TableCell>{format(new Date(log.date), 'PPP')}</TableCell>
                                        <TableCell>{getServiceTypeLabel(log.serviceType)}</TableCell>
                                        <TableCell className="max-w-sm">{log.description}</TableCell>
                                        <TableCell>{log.cost ? `$${log.cost.toFixed(2)}` : 'N/A'}</TableCell>
                                        <TableCell>{log.mechanic || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => removeLog(log.id)} aria-label={`Remove log for ${log.assetName}`}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">No maintenance logs found.</div>
                    )}
                </CardContent>
            </Card>
        </CardContent>
      </Card>
    </div>
  );
}
