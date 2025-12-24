
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type {MaintenanceSchedule} from '@/lib/types';

const MaintenanceScheduleInputSchema = z.object({
  year: z.string(),
  make: z.string(),
  model: z.string(),
});

const MaintenanceScheduleItemSchema = z.object({
  intervalMonths: z.number().describe('The recommended service interval in months.'),
});

const MaintenanceScheduleOutputSchema = z.object({
  oilChange: MaintenanceScheduleItemSchema.optional(),
  tireRotation: MaintenanceScheduleItemSchema.optional(),
  brakeInspection: MaintenanceScheduleItemSchema.optional(),
  fluidCheck: MaintenanceScheduleItemSchema.optional(),
});


export async function getMaintenanceSchedule(input: z.infer<typeof MaintenanceScheduleInputSchema>): Promise<Partial<MaintenanceSchedule>> {
    
    const getSchedulePrompt = ai.definePrompt({
        name: 'getMaintenanceSchedulePrompt',
        inputSchema: MaintenanceScheduleInputSchema,
        output: {
            format: 'json',
            schema: MaintenanceScheduleOutputSchema,
        },
        prompt: `Based on general industry standards for a heavy-duty or commercial vehicle, provide a standard preventative maintenance schedule for a {{year}} {{make}} {{model}}.
        
        Provide intervals in months.
        - Oil Change: Typically every 6 months for commercial use.
        - Tire Rotation: Typically every 6 months.
        - Brake Inspection: Typically every 12 months.
        - Fluid Check (Transmission, Differential): Typically every 12 months.
        
        Return the data in the requested JSON format.
        `,
    });

    const llmResponse = await getSchedulePrompt.generate({ input });
    return llmResponse.output()!;
}
