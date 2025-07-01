'use server';
/**
 * @fileOverview A Genkit flow for intelligently optimizing a snow route based on multiple constraints.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// A simplified Job object for the AI prompt
const SnowRouteJobSchema = z.object({
    id: z.string(),
    name: z.string().describe("The name of the job or contract."),
    address: z.string().describe("The full street address of the job site."),
    openingTime: z.string().optional().describe("The opening time of the business in HH:MM format (24-hour)."),
    closingTime: z.string().optional().describe("The closing time of the business in HH:MM format (24-hour)."),
    equipmentNeeds: z.string().optional().describe("A description of any special equipment required for this job, e.g., 'Skid steer', 'Loader with pusher box', 'Salt spreader'.")
});

const OptimizeSnowRouteInputSchema = z.object({
  jobs: z.array(SnowRouteJobSchema).describe("An array of job objects that need to be sequenced."),
  startAndEndAddress: z.string().describe("The starting and ending address for the route, e.g., the company's office address.").optional(),
});
export type OptimizeSnowRouteInput = z.infer<typeof OptimizeSnowRouteInputSchema>;

const OptimizedJobSchema = z.object({
    id: z.string().describe("The original ID of the job."),
    name: z.string().describe("The name of the job."),
    address: z.string().describe("The address of the job."),
    optimizedOrder: z.number().describe("The new sequence number for this job in the route."),
});

const OptimizeSnowRouteOutputSchema = z.object({
    optimizedJobs: z.array(OptimizedJobSchema).describe("The list of jobs in their newly optimized order."),
    rationale: z.string().describe("A brief, high-level summary explaining the logic behind the optimized route, mentioning any key decisions about timing or equipment grouping."),
});
export type OptimizeSnowRouteOutput = z.infer<typeof OptimizeSnowRouteOutputSchema>;

export async function optimizeSnowRoute(input: OptimizeSnowRouteInput): Promise<OptimizeSnowRouteOutput> {
  return optimizeSnowRouteFlow(input);
}

const prompt = ai.definePrompt({
    name: 'optimizeSnowRoutePrompt',
    input: {schema: OptimizeSnowRouteInputSchema},
    output: {schema: OptimizeSnowRouteOutputSchema},
    prompt: `You are an expert logistics dispatcher for a snow removal company. Your task is to create the most efficient and logical route for a snowplow crew based on a list of jobs.

You must consider multiple constraints to create the best possible plan:
1.  **Geographic Efficiency:** The route should minimize travel time between jobs. Group jobs that are close to each other.
2.  **Business Hours:** Prioritize jobs with earlier opening times. A job cannot be started before its opening time.
3.  **Equipment Grouping:** If some jobs require specific equipment (like a skid steer), try to group them together in the sequence to minimize loading/unloading of that equipment.

{{#if startAndEndAddress}}
The route must start and end at: {{{startAndEndAddress}}}.
{{/if}}

Here is the list of jobs to sequence:
{{#each jobs}}
- Job ID: {{id}}
  Name: {{name}}
  Address: {{address}}
  {{#if openingTime}}Opening Time: {{openingTime}}{{/if}}
  {{#if equipmentNeeds}}Equipment: {{equipmentNeeds}}{{/if}}
{{/each}}

Please reorder the jobs into the most efficient sequence. Assign an 'optimizedOrder' number to each job, starting from 1. Provide a brief 'rationale' explaining your high-level strategy (e.g., "Started with the 24-hour locations, then moved to the west side to handle the business park before they open at 9 AM, finishing with the residential contracts.").

Provide your response in the structured JSON output format.
`,
});

const optimizeSnowRouteFlow = ai.defineFlow(
  {
    name: 'optimizeSnowRouteFlow',
    inputSchema: OptimizeSnowRouteInputSchema,
    outputSchema: OptimizeSnowRouteOutputSchema,
  },
  async (input) => {
    if (input.jobs.length === 0) {
        return { optimizedJobs: [], rationale: "No jobs were provided for optimization." };
    }
    const {output} = await prompt(input);
    
    // Basic validation to ensure the AI didn't hallucinate jobs
    if (output && output.optimizedJobs) {
        const originalIds = new Set(input.jobs.map(j => j.id));
        const optimizedIds = new Set(output.optimizedJobs.map(j => j.id));
        if (originalIds.size !== optimizedIds.size || ![...originalIds].every(id => optimizedIds.has(id))) {
            console.warn("AI returned a different set of jobs. Falling back to original order.");
            const fallbackJobs = input.jobs.map((job, index) => ({
                id: job.id,
                name: job.name,
                address: job.address,
                optimizedOrder: index + 1,
            }));
            return { optimizedJobs: fallbackJobs, rationale: "AI failed to return a valid job list. Displaying in original order." };
        }
        // Sort the returned jobs by the new order
        output.optimizedJobs.sort((a, b) => a.optimizedOrder - b.optimizedOrder);
    } else {
         console.warn("AI failed to return an optimized route. Falling back to original order.");
         const fallbackJobs = input.jobs.map((job, index) => ({
            id: job.id,
            name: job.name,
            address: job.address,
            optimizedOrder: index + 1,
        }));
        return { optimizedJobs: fallbackJobs, rationale: "AI processing failed. Displaying in original order." };
    }

    return output;
  }
);
