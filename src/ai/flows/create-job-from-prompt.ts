
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { CreateJobFromPromptOutputSchema } from './create-job-from-prompt-schema';
import type { CreateJobFromPromptOutput } from './create-job-from-prompt-schema';


export async function createJobFromPrompt(prompt: string): Promise<CreateJobFromPromptOutput> {
  const createJobPrompt = ai.definePrompt({
    name: 'createJobPrompt',
    prompt: `You are an expert at parsing job descriptions into structured data. Extract the details from the following prompt into the provided JSON format. Today's date is ${new Date().toDateString()}.

    Prompt: "${prompt}"`,
    output: {
      format: 'json',
      schema: CreateJobFromPromptOutputSchema,
    },
  });

  const llmResponse = await createJobPrompt.generate();
  return llmResponse.output()!;
}
