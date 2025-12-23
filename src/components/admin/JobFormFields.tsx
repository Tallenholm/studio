

'use client';

import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Truck, Box, Shovel, Users as UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import AddressAutocomplete from './AddressAutocomplete';
import { jobSchema } from './JobManagementPage'; // Import schema from parent
import type { Client, FleetAsset, User } from '@/lib/types';

interface JobFormFieldsProps {
  form: UseFormReturn<z.infer<typeof jobSchema>>;
  clients: Client[];
  fleetAssets: FleetAsset[];
  users: User[];
}

const MultiSelectDropdown = ({ items, fieldName, title, Icon, form }: { items: { id: string, name: string }[], fieldName: any, title: string, Icon: React.ElementType, form: UseFormReturn<any> }) => {
    const selectedIds = form.watch(fieldName) || [];
    return (
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</FormLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {selectedIds.length > 0 ? `${selectedIds.length} selected` : `Select...`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel>{title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.map(item => (
                  <DropdownMenuCheckboxItem
                    key={item.id}
                    checked={field.value?.includes(item.id)}
                    onCheckedChange={(checked) => {
                      return checked
                        ? field.onChange([...(field.value || []), item.id])
                        : field.onChange(field.value?.filter((value: string) => value !== item.id))
                    }}
                  >
                    {item.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

export default function JobFormFields({ form, clients, fleetAssets, users }: JobFormFieldsProps) {
  const watchedJobType = form.watch('jobType');
  const isMapsApiKeyAvailable = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { trucks, trailers, heavyEquipments } = useMemo(() => ({
    trucks: fleetAssets.filter(a => a.type === 'truck'),
    trailers: fleetAssets.filter(a => a.type === 'trailer'),
    heavyEquipments: fleetAssets.filter(a => a.type === 'heavyEquipment'),
  }), [fleetAssets]);

  return (
    <>
      <FormField control={form.control} name="jobType" render={({ field }) => (
          <FormItem>
              <FormLabel>Job Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a job type" /></SelectTrigger></FormControl>
                  <SelectContent>
                      <SelectItem value="excavation">Excavation</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="landscaping">Landscaping</SelectItem>
                      <SelectItem value="snow_removal">Snow Removal</SelectItem>
                      <SelectItem value="misc">Miscellaneous</SelectItem>
                  </SelectContent>
              </Select>
              <FormMessage />
          </FormItem>
      )} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input placeholder={'e.g., Lot 5 Excavation'} {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><AddressAutocomplete value={field.value} onChange={field.onChange} placeholder="e.g., 123 Main St, Anytown" isApiKeyAvailable={isMapsApiKeyAvailable}/></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="clientId" render={({ field }) => ( <FormItem> <FormLabel>Client</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl> <SelectContent>{clients.map(client => (<SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
          </div>
          <div className="space-y-4">
              <FormField control={form.control} name="jobValue" render={({ field }) => ( <FormItem> <FormLabel>Job/Contract Value (Optional)</FormLabel> <FormControl><Input type="number" placeholder="e.g., 25000.00" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="dateRange" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Start & End Date</FormLabel> <Popover> <PopoverTrigger asChild><FormControl><Button id="date" variant={"outline"} className={cn("justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>) : (format(field.value.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}</Button></FormControl></PopoverTrigger> <PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={field.value?.from} selected={{ from: field.value?.from, to: field.value?.to }} onSelect={field.onChange} numberOfMonths={2}/></PopoverContent> </Popover> <FormMessage /> </FormItem> )}/>
              {watchedJobType === 'concrete' && <FormField control={form.control} name="concreteYards" render={({ field }) => ( <FormItem> <FormLabel>Estimated Concrete (yd³)</FormLabel> <FormControl><Input type="number" placeholder="Calculated or enter manually" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>}
          </div>
      </div>
      
      {watchedJobType !== 'snow_removal' ? (
          <>
              <Separator />
              <h3 className="text-lg font-medium">Assign Personnel & Fleet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MultiSelectDropdown items={users} fieldName="assignedEmployeeIds" title="Assign Employees" Icon={UsersIcon} form={form} />
                  <MultiSelectDropdown items={trucks} fieldName="assignedTruckIds" title="Assign Trucks" Icon={Truck} form={form} />
                  <MultiSelectDropdown items={trailers} fieldName="assignedTrailerIds" title="Assign Trailers" Icon={Box} form={form} />
                  <MultiSelectDropdown items={heavyEquipments} fieldName="assignedHeavyEquipmentIds" title="Assign Equipment" Icon={Shovel} form={form} />
              </div>
          </>
      ) : (
          <>
              <Separator />
              <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                  <h4 className="font-semibold">Services Provided</h4>
                  <div className="flex items-center space-x-6">
                      <FormField control={form.control} name="snowServices.plowing" render={({ field }) => (<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Plowing</FormLabel></FormItem>)}/>
                      <FormField control={form.control} name="snowServices.salting" render={({ field }) => (<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Salting</FormLabel></FormItem>)}/>
                      <FormField control={form.control} name="snowServices.sidewalks" render={({ field }) => (<FormItem className="flex items-center space-x-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Sidewalks</FormLabel></FormItem>)}/>
                  </div>
                  <Separator />
                  <h4 className="font-semibold">Business Hours & Special Equipment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="openingTime" render={({ field }) => ( <FormItem> <FormLabel>Opening Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <FormField control={form.control} name="closingTime" render={({ field }) => ( <FormItem> <FormLabel>Closing Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                      <FormField control={form.control} name="equipmentNeeds" render={({ field }) => ( <FormItem> <FormLabel>Specific Equipment</FormLabel> <FormControl><Input placeholder="e.g., Skid steer" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                  </div>
                  <Separator />
                  <h4 className="font-semibold">Assign Plowing Crew & Fleet</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <MultiSelectDropdown items={users} fieldName="assignedEmployeeIds" title="Assign Plow Crew" Icon={UsersIcon} form={form} />
                      <MultiSelectDropdown items={trucks} fieldName="assignedTruckIds" title="Assign Trucks" Icon={Truck} form={form} />
                      <MultiSelectDropdown items={heavyEquipments} fieldName="assignedHeavyEquipmentIds" title="Assign Loaders" Icon={Shovel} form={form} />
                  </div>
                   <Separator />
                  <h4 className="font-semibold">Assign Sidewalk Crew</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <MultiSelectDropdown items={users} fieldName="assignedSidewalkCrewIds" title="Assign Sidewalk Crew" Icon={UsersIcon} form={form} />
                  </div>
               </div>
          </>
      )}
    </>
  );
}
