
'use server';
import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';
import { CreateJobFromPromptOutputSchema } from './create-job-from-prompt-schema';
import type { CreateJobFromPromptOutput } from './create-job-from-prompt-schema';
import { getClients } from '@/lib/firestoreService';
import type { Client } from '@/lib/types';


const searchClientsTool = ai.defineTool(
  {
    name: 'searchClients',
    description: 'Searches for clients by name to get their exact name and ID.',
    inputSchema: z.object({
      query: z.string().describe('The name of the client to search for.'),
    }),
    outputSchema: z.array(
      z.object({ id: z.string(), name: z.string() })
    ),
  },
  async ({ query }) => {
    const clients = await getClients();
    // In a larger application, this would be a more sophisticated search (e.g., Algolia, vector search)
    // For this app, a simple filter is sufficient.
    return clients
      .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5); // Return top 5 matches
  }
);

export async function createJobFromPrompt(prompt: string): Promise<CreateJobFromPromptOutput> {

  const promptText = `You are an expert at parsing job descriptions into structured data. Extract the details from the following prompt into the provided JSON format. Today's date is ${new Date().toDateString()}.

    If a client name is mentioned in the prompt, you MUST use the 'searchClients' tool to find the exact client name. If multiple clients match, use the most likely one based on the prompt context. Do not guess a client name if you cannot find a match.

    Prompt: "${prompt}"`;

  const llmResponse = await ai.generate({
    prompt: promptText,
    model: DEFAULT_MODEL, // Use the centralized model constant
    tools: [searchClientsTool],
    output: {
      format: 'json',
      schema: CreateJobFromPromptOutputSchema,
    },
  });
  
  const output = llmResponse.output;
  if (!output) {
    throw new Error("AI failed to generate a valid job structure.");
  }
  return output;
}
