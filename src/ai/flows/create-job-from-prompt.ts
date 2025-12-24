
'use server';
import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const CreateJobFromPromptOutputSchema = z.object({
  name: z.string().describe('A concise, descriptive name for the job.'),
  clientName: z.string().describe('The name of the client for whom the job is being done.'),
  address: z.string().describe('The full street address where the job will take place.'),
  jobValue: z.number().optional().describe('The monetary value of the job, if mentioned.'),
  jobType: z.enum(['excavation', 'utilities', 'concrete', 'landscaping', 'snow_removal', 'misc']).describe('The type of job.'),
  startDate: z.string().describe('The start date of the job in YYYY-MM-DD format.'),
  endDate: z.string().describe('The end date of the job in YYYY-MM-DD format.'),
  concreteYards: z.number().optional().describe('The estimated cubic yards of concrete needed, if it is a concrete job.'),
});

export type CreateJobFromPromptOutput = z.infer<typeof CreateJobFromPromptOutputSchema>;

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
