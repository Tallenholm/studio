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
import type { InspectionItem, InspectionStatus } from '@/lib/types';
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
              <FormItem className="mt-4">
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
    </div>
  );
}
