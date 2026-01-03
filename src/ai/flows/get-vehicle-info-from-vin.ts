
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
 * A Genkit Tool that directly calls the NHTSA (National Highway Traffic Safety Administration)
 * public API to decode a Vehicle Identification Number (VIN).
 */
const getVehicleInfoFromVinTool = ai.defineTool(
  {
    name: 'getVehicleInfoFromVinTool',
    description: 'Fetches vehicle information from the NHTSA API based on a VIN.',
    inputSchema: z.string(), // The tool takes a simple string (the VIN)
    outputSchema: z.any(), // The output from the API can be complex, so we use z.any()
  },
  async (vin) => {
    try {
      const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`);
      if (!response.ok) {
        throw new Error(`NHTSA API failed with status: ${response.status}`);
      }
      const data = await response.json();
      // The API returns an array in the 'Results' property
      return data?.Results?.[0] || null;
    } catch (error) {
      console.error('NHTSA API call failed:', error);
      throw error;
    }
  }
);


/**
 * Defines the main Genkit flow for getting vehicle info. This flow uses the
 * NHTSA tool to fetch the data and then processes it into our desired format.
 */
const getVehicleInfoFlow = ai.defineFlow(
  {
    name: 'getVehicleInfoFlow',
    inputSchema: VehicleInfoInputSchema,
    outputSchema: VehicleInfoOutputSchema,
  },
  async (input) => {
    const vinData = await getVehicleInfoFromVinTool(input.vin);

    if (!vinData || vinData.ErrorCode !== '0') {
      throw new Error(`VIN could not be decoded. API Error: ${vinData?.ErrorText || 'Unknown error'}`);
    }

    // Extract the required fields from the API response
    const year = vinData.ModelYear;
    const make = vinData.Make;
    const model = vinData.Model;

    if (!year || !make || !model) {
      throw new Error('API response was missing one or more required fields (Year, Make, Model).');
    }

    return {
      year,
      make,
      model,
    };
  }
);

/**
 * The main exported function that client-side components will call.
 * This wraps our Genkit flow, providing a simple async function interface.
 */
export async function getVehicleInfoFromVin(input: VehicleInfoInput): Promise<VehicleInfoOutput> {
  return getVehicleInfoFlow(input);
}
