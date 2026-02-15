
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SuggestMaintenanceScheduleInputSchema = z.object({
  year: z.string(),
  make: z.string(),
  model: z.string(),
});

const MaintenanceScheduleItemSchema = z.object({
  intervalMonths: z.number().describe('The recommended service interval in months.'),
});

export const SuggestMaintenanceScheduleOutputSchema = z.object({
  oilChange: MaintenanceScheduleItemSchema.optional(),
  tireRotation: MaintenanceScheduleItemSchema.optional(),
  brakeInspection: MaintenanceScheduleItemSchema.optional(),
  fluidCheck: MaintenanceScheduleItemSchema.optional(),
});

export type SuggestMaintenanceScheduleOutput = z.infer<typeof SuggestMaintenanceScheduleOutputSchema>;

export async function suggestMaintenanceSchedule(
  input: z.infer<typeof SuggestMaintenanceScheduleInputSchema>
): Promise<SuggestMaintenanceScheduleOutput> {
  /* import DEFAULT_MODEL if not present */
  const prompt = `You are an expert automotive maintenance advisor.
    
    Based on the vehicle year, make, and model provided, generate a standard preventative maintenance schedule.
    
    Provide the recommended interval in months for the following items:
    - Oil Change
    - Tire Rotation
    - Brake Inspection
    - Fluid Check
    
    For a standard consumer vehicle, typical intervals are:
    - Oil Change: 6 months
    - Tire Rotation: 6 months
    - Brake Inspection: 12 months
    - Fluid Check: 3 months

    For a commercial truck (like a Ford F-550, Ram 5500, etc.), use more frequent intervals like:
    - Oil Change: 3 months
    - Tire Rotation: 3 months
    - Brake Inspection: 6 months
    - Fluid Check: 1 month

    Do not include a 'lastServiceDate'. Only provide the interval in months.

    Vehicle: ${input.year} ${input.make} ${input.model}
    `;

  const llmResponse = await ai.generate({
    prompt,
    model: 'gemini-1.5-flash',
    output: {
      format: 'json',
      schema: SuggestMaintenanceScheduleOutputSchema,
    },
  });

  const output = llmResponse.output;
  if (!output) {
    throw new Error("AI failed to generate a valid maintenance schedule.");
  }
  return output;
}
