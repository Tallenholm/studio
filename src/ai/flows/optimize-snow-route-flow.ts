
'use server';

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';

const OptimizeSnowRouteInputSchema = z.object({
  jobs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    openingTime: z.string().optional().describe("e.g., '08:00'"),
    closingTime: z.string().optional().describe("e.g., '17:00'"),
    equipmentNeeds: z.string().optional().describe("e.g., 'Skid Steer'"),
  })),
});

export type OptimizeSnowRouteInput = z.infer<typeof OptimizeSnowRouteInputSchema>;

export const OptimizeSnowRouteOutputSchema = z.object({
  optimizedJobs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
  })).describe('The list of jobs in the optimized order.'),
  rationale: z.string().describe('A brief explanation for why this order was chosen (e.g., geographical proximity, respecting business hours).'),
});

export type OptimizeSnowRouteOutput = z.infer<typeof OptimizeSnowRouteOutputSchema>;

export async function optimizeSnowRoute(input: OptimizeSnowRouteInput): Promise<OptimizeSnowRouteOutput> {

  const prompt = `You are an expert snow removal dispatcher. Your task is to optimize a list of snow removal jobs into the most efficient route.

    Consider the following factors in order of importance:
    1.  **Geography**: Group jobs that are geographically close to each other to minimize travel time.
    2.  **Business Hours**: Prioritize jobs that have specific opening or closing times. A job should not be scheduled outside its service window. It is currently ${new Date().toLocaleTimeString()}.
    3.  **Equipment**: If different jobs require different types of equipment, try to group them to minimize equipment changes.

    Based on the list of jobs provided, return the optimized order and a brief rationale for your decision.

    Current Time: ${new Date().toLocaleString()}

    Jobs to optimize:
    ${input.jobs.map(j => `
    - ID: ${j.id}
      Name: ${j.name}
      Address: ${j.address}
      Hours: ${j.openingTime || 'N/A'} - ${j.closingTime || 'N/A'}
      Equipment: ${j.equipmentNeeds || 'N/A'}
    `).join('')}
    `;

  const llmResponse = await ai.generate({
    prompt,
    model: DEFAULT_MODEL,
    output: {
      format: 'json',
      schema: OptimizeSnowRouteOutputSchema,
    },
  });

  const output = llmResponse.output;

  if (!output) {
    throw new Error("AI failed to generate an optimized route plan.");
  }

  // Ensure the output contains all original job IDs
  const originalIds = new Set(input.jobs.map(j => j.id));
  const optimizedIds = new Set(output.optimizedJobs.map(j => j.id));
  if (originalIds.size !== optimizedIds.size) {
    console.warn("AI output has incorrect number of jobs, returning original order.");
    return {
      optimizedJobs: input.jobs,
      rationale: "AI could not produce a valid route (length mismatch). Displaying original order."
    }
  }

  for (const id of originalIds) {
    if (!optimizedIds.has(id)) {
      console.warn(`AI output is missing job ID ${id}, returning original order.`);
      return {
        optimizedJobs: input.jobs,
        rationale: "AI omitted a required job in its route. Displaying original order."
      }
    }
  }

  return output;
}
