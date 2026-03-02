
'use server';

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';
import { getCachedMaintenanceSchedule, setCachedMaintenanceSchedule } from '@/lib/firestoreService';

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

  // Create a unique, URL-safe cache key from the input
  const cacheKey = `${input.year}-${input.make}-${input.model}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // 1. Check cache first
  const cachedSchedule = await getCachedMaintenanceSchedule(cacheKey);
  if (cachedSchedule) {
    console.log(`[Cache HIT] Returning cached maintenance schedule for ${cacheKey}`);
    return cachedSchedule;
  }

  console.log(`[Cache MISS] Generating new maintenance schedule for ${cacheKey}`);

  // 2. If not in cache, call the AI model
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
    model: DEFAULT_MODEL,
    output: {
      format: 'json',
      schema: SuggestMaintenanceScheduleOutputSchema,
    },
  });

  const output = llmResponse.output;
  if (!output) {
    throw new Error("AI failed to generate a valid maintenance schedule.");
  }

  // 3. Save the new response to the cache before returning
  await setCachedMaintenanceSchedule(cacheKey, output);

  return output;
}
