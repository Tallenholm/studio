
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for the output of our main flow
export const VehicleInfoOutputSchema = z.object({
  year: z.string().describe("The model year of the vehicle."),
  make: z.string().describe("The manufacturer of the vehicle (e.g., Ford, Chevrolet)."),
  model: z.string().describe("The specific model of the vehicle (e.g., F-550, Silverado 3500HD)."),
});
export type VehicleInfoOutput = z.infer<typeof VehicleInfoOutputSchema>;

// Define the schema for the input of our main flow
export const VehicleInfoInputSchema = z.object({
  vin: z.string().min(1, 'A VIN or serial number is required.'),
});
export type VehicleInfoInput = z.infer<typeof VehicleInfoInputSchema>;

/**
 * A direct server action to decode a VIN using the NHTSA API.
 * This replaces the previous Genkit flow for improved reliability.
 */
export async function getVehicleInfoFromVin(input: VehicleInfoInput): Promise<VehicleInfoOutput> {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${input.vin}?format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NHTSA API failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.Results?.[0];

    if (!results || results.ErrorCode !== '0') {
      const errorMsg = results?.ErrorText || 'VIN could not be decoded.';
      if (errorMsg.includes("VIN is not 17 characters")) {
        throw new Error("Invalid VIN length. Please enter a full 17-character VIN for decoding.");
      }
      throw new Error(errorMsg);
    }
    
    const year = results.ModelYear;
    const make = results.Make;
    const model = results.Model;

    if (!year || !make || !model) {
      throw new Error('API returned incomplete data. Year, Make, or Model is missing.');
    }

    return {
      year,
      make,
      model,
    };
  } catch (error) {
    console.error(`VIN Decode Error for ${input.vin}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during VIN decoding.';
    throw new Error(errorMessage);
  }
}
