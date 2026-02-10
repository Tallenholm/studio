
'use server';

import { ai } from '@/ai/genkit';
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

  const optimizeRoutePrompt = ai.definePrompt({
    name: 'optimizeSnowRoutePrompt',
    inputSchema: OptimizeSnowRouteInputSchema,
    output: {
      format: 'json',
      schema: OptimizeSnowRouteOutputSchema,
    },
    prompt: `You are an expert snow removal dispatcher. Your task is to optimize a list of snow removal jobs into the most efficient route.

    Consider the following factors in order of importance:
    1.  **Geography**: Group jobs that are geographically close to each other to minimize travel time.
    2.  **Business Hours**: Prioritize jobs that have specific opening or closing times. A job should not be scheduled outside its service window. It is currently ${new Date().toLocaleTimeString()}.
    3.  **Equipment**: If different jobs require different types of equipment, try to group them to minimize equipment changes.

    Based on the list of jobs provided, return the optimized order and a brief rationale for your decision.

    Current Time: ${new Date().toLocaleString()}

    Jobs to optimize:
    {{#each jobs}}
    - ID: {{this.id}}
      Name: {{this.name}}
      Address: {{this.address}}
      Hours: {{this.openingTime}} - {{this.closingTime}}
      Equipment: {{this.equipmentNeeds}}
    {{/each}}
    `,
  });

  const llmResponse = await optimizeRoutePrompt.generate({ input });
  const output = llmResponse.output();
  
  if (!output) {
      throw new Error("AI failed to generate an optimized route plan.");
  }

  // Ensure the output contains all original job IDs
  const originalIds = new Set(input.jobs.map(j => j.id));
  const optimizedIds = new Set(output.optimizedJobs.map(j => j.id));
  if (originalIds.size !== optimizedIds.size) {
      console.warn("AI output is missing jobs, returning original order.");
      return {
          optimizedJobs: input.jobs,
          rationale: "AI could not produce a valid route. Displaying original order."
      }
  }

  return output;
}
