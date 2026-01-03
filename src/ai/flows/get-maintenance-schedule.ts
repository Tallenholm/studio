
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type {MaintenanceSchedule} from '@/lib/types';

export const MaintenanceScheduleInputSchema = z.object({
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

export const VehicleInfoInputSchema = z.object({
  vin: z.string().min(1, 'A VIN or serial number is required.'),
});

export const VehicleInfoOutputSchema = z.object({
    year: z.string().describe("The model year of the vehicle."),
    make: z.string().describe("The manufacturer of the vehicle (e.g., Ford, Chevrolet)."),
    model: z.string().describe("The specific model of the vehicle (e.g., F-550, Silverado 3500HD)."),
});

export async function getVehicleInfoFromVin(input: z.infer<typeof VehicleInfoInputSchema>): Promise<z.infer<typeof VehicleInfoOutputSchema>> {
    
    const getVehicleInfoPrompt = ai.definePrompt({
        name: 'getVehicleInfoPrompt',
        inputSchema: VehicleInfoInputSchema,
        output: {
            format: 'json',
            schema: VehicleInfoOutputSchema,
        },
        prompt: `You are an expert VIN decoder. Your task is to extract the vehicle's year, make, and model from the provided Vehicle Identification Number (VIN).

        Follow these steps:
        1.  Analyze the provided VIN: {{vin}}
        2.  The 10th character of a standard 17-digit VIN typically represents the model year.
        3.  The first few characters often indicate the manufacturer.
        4.  Use the full VIN to determine the specific model.
        5.  If it's not a standard 17-character VIN, do your best to identify the vehicle from the provided identifier.

        Return the data in the requested JSON format.`,
    });

    const llmResponse = await getVehicleInfoPrompt.generate({ input });
    return llmResponse.output()!;
}
