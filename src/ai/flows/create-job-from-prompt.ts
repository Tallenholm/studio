
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { CreateJobFromPromptOutputSchema } from './create-job-from-prompt-schema';
import type { CreateJobFromPromptOutput } from './create-job-from-prompt-schema';
import { getClients } from '@/lib/firestoreService';
import type { Client } from '@/lib/types';


export async function createJobFromPrompt(prompt: string): Promise<CreateJobFromPromptOutput> {
  const clients = await getClients();
  const clientList = clients.map(c => `"${c.name}" (ID: ${c.id})`).join(', ');
  
  const createJobPrompt = ai.definePrompt({
    name: 'createJobPrompt',
    prompt: `You are an expert at parsing job descriptions into structured data. Extract the details from the following prompt into the provided JSON format. Today's date is ${new Date().toDateString()}.

    If the client name in the prompt matches a client in the list below, use the corresponding client name.
    
    Available Clients: [${clientList}]

    Prompt: "${prompt}"`,
    output: {
      format: 'json',
      schema: CreateJobFromPromptOutputSchema,
    },
  });

  const llmResponse = await createJobPrompt.generate();
  const output = llmResponse.output();
  if (!output) {
      throw new Error("AI failed to generate a valid job structure.");
  }
  return output;
}
