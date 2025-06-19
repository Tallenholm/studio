'use client';

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
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { InspectionItem, InspectionStatus } from '@/lib/types';
import { Info, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  
  const getStatusIcon = (status: InspectionStatus) => {
    if (status === 'pass') return <CheckCircle2 className="text-green-500" />;
    if (status === 'fail') return <XCircle className="text-red-500" />;
    return <AlertTriangle className="text-yellow-500" />;
  };

  return (
    <div className={cn("p-4 rounded-lg border transition-all duration-300", getStatusColor(currentStatus))}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <item.Icon className={cn("h-6 w-6", 
            currentStatus === 'pass' ? 'text-green-600' : 
            currentStatus === 'fail' ? 'text-red-600' : 'text-primary'
          )} />
          <span className="font-medium text-lg">{item.name}</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Instructions for ${item.name}`}>
              <Info className="h-5 w-5 text-muted-foreground hover:text-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <h4 className="font-medium mb-2">Inspection Criteria:</h4>
            <p className="text-sm text-muted-foreground">{item.instructions}</p>
          </PopoverContent>
        </Popover>
      </div>

      <FormField
        control={control}
        name={`${fieldNamePrefix}.status`}
        render={({ field }) => (
          <FormItem className="mb-2">
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex space-x-4"
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

      {currentStatus === 'fail' && (
        <FormField
          control={control}
          name={`${fieldNamePrefix}.notes`}
          render={({ field }) => (
            <FormItem className="mt-2">
              <FormLabel className="text-sm text-muted-foreground">Notes (Required if Fail)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the issue..."
                  {...field}
                  className="bg-card"
                  aria-label={`Notes for ${item.name}`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
