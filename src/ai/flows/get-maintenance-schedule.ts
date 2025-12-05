'use server';
/**
 * @fileOverview A Genkit flow for suggesting a preventative maintenance schedule for a vehicle.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GetMaintenanceScheduleInputSchema = z.object({
  year: z.string().describe('The manufacturing year of the vehicle.'),
  make: z.string().describe('The make or manufacturer of the vehicle (e.g., Ford, CAT).'),
  model: z.string().describe('The model of the vehicle (e.g., F-550, 259D3).'),
});
export type GetMaintenanceScheduleInput = z.infer<typeof GetMaintenanceScheduleInputSchema>;

export const MaintenanceIntervalSchema = z.object({
    intervalMonths: z.number().describe('The recommended interval in months for this service.'),
});

export const GetMaintenanceScheduleOutputSchema = z.object({
  oilChange: MaintenanceIntervalSchema.optional().describe('Engine oil and filter change.'),
  tireRotation: MaintenanceIntervalSchema.optional().describe('Tire rotation.'),
  brakeInspection: MaintenanceIntervalSchema.optional().describe('Brake system inspection.'),
  fluidCheck: MaintenanceIntervalSchema.optional().describe('Inspection of all critical fluids (coolant, transmission, etc.).'),
});
export type GetMaintenanceScheduleOutput = z.infer<typeof GetMaintenanceScheduleOutputSchema>;

export async function getMaintenanceSchedule(input: GetMaintenanceScheduleInput): Promise<GetMaintenanceScheduleOutput> {
  return getMaintenanceScheduleFlow(input);
}

const prompt = ai.definePrompt({
    name: 'getMaintenanceSchedulePrompt',
    input: {schema: GetMaintenanceScheduleInputSchema},
    output: {schema: GetMaintenanceScheduleOutputSchema},
    prompt: `You are an expert fleet mechanic. Based on the provided vehicle information, suggest a standard preventative maintenance schedule. 
    
Provide the recommended interval in months for each of the following services if applicable for a commercial vehicle of this type: oil change, tire rotation, brake inspection, and general fluid check. 
    
Do not include services that are not on this list. If a service is not typically scheduled for this type of vehicle (e.g., tire rotation for a tracked skid steer), omit it from the output.

Vehicle: {{{year}}} {{{make}}} {{{model}}}

Provide your response in the structured output format.`,
});

const getMaintenanceScheduleFlow = ai.defineFlow(
  {
    name: 'getMaintenanceScheduleFlow',
    inputSchema: GetMaintenanceScheduleInputSchema,
    outputSchema: GetMaintenanceScheduleOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
