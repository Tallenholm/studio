'use server';
/**
 * @fileOverview A Genkit flow for optimizing a list of addresses for a route.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeRouteInputSchema = z.object({
  addresses: z.array(z.string()).describe("An array of street addresses to be routed."),
  startAndEndAddress: z.string().describe("The starting and ending address for the route, e.g., the company's office address.").optional(),
});
export type OptimizeRouteInput = z.infer<typeof OptimizeRouteInputSchema>;

const OptimizeRouteOutputSchema = z.object({
    optimizedAddresses: z.array(z.string()).describe("The original addresses, returned in the most efficient order for a route."),
});
export type OptimizeRouteOutput = z.infer<typeof OptimizeRouteOutputSchema>;

export async function optimizeRoute(input: OptimizeRouteInput): Promise<OptimizeRouteOutput> {
  return optimizeRouteFlow(input);
}

const prompt = ai.definePrompt({
    name: 'optimizeRoutePrompt',
    input: {schema: OptimizeRouteInputSchema},
    output: {schema: OptimizeRouteOutputSchema},
    prompt: `You are a logistics expert tasked with creating the most efficient travel route.

Analyze the following list of addresses. Reorder them to create the most logical and efficient route for a vehicle to follow.
{{#if startAndEndAddress}}
The route must start and end at the following address: {{{startAndEndAddress}}}. This address should be the first and last item in the optimized list if it's not already in the main list. If it is in the main list, it should be the start point.
{{else}}
The route should start at the most logical address from the list and visit all other addresses sequentially.
{{/if}}

Do not add, remove, or modify any of the provided addresses. Simply return them in the optimal order.

Addresses to optimize:
{{#each addresses}}
- {{{this}}}
{{/each}}

Provide your response in the structured JSON output format.
`,
});

const optimizeRouteFlow = ai.defineFlow(
  {
    name: 'optimizeRouteFlow',
    inputSchema: OptimizeRouteInputSchema,
    outputSchema: OptimizeRouteOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    
    // Basic validation to ensure the AI didn't hallucinate addresses
    if (output && output.optimizedAddresses) {
        const originalSet = new Set(input.addresses.map(a => a.toLowerCase().trim()));
        const optimizedSet = new Set(output.optimizedAddresses.map(a => a.toLowerCase().trim()));
        if (originalSet.size !== optimizedSet.size || ![...originalSet].every(addr => optimizedSet.has(addr))) {
            console.warn("AI returned a different set of addresses. Falling back to original order.");
            return { optimizedAddresses: input.addresses };
        }
    } else {
         console.warn("AI failed to return optimized addresses. Falling back to original order.");
         return { optimizedAddresses: input.addresses };
    }

    return output;
  }
);
