
'use server';
/**
 * @fileOverview A Genkit flow for creating a job from a natural language prompt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {format} from 'date-fns';

const CreateJobFromPromptInputSchema = z.string();
export type CreateJobFromPromptInput = z.infer<typeof CreateJobFromPromptInputSchema>;

const CreateJobFromPromptOutputSchema = z.object({
  name: z.string().describe('A concise name for the job, e.g., "Lot 5 Excavation".'),
  clientName: z.string().describe('The name of the client for this job. Extract it precisely from the prompt.'),
  address: z.string().describe('The full address of the job site.'),
  jobValue: z.number().optional().describe('The total monetary value of the job. Should be a number. If not mentioned, this field should be omitted.'),
  startDate: z.string().describe("The start date of the job in 'YYYY-MM-DD' format."),
  endDate: z.string().describe("The end date of the job in 'YYYY-MM-DD' format."),
});
export type CreateJobFromPromptOutput = z.infer<typeof CreateJobFromPromptOutputSchema>;

export async function createJobFromPrompt(input: CreateJobFromPromptInput): Promise<CreateJobFromPromptOutput> {
  return createJobFromPromptFlow(input);
}

const prompt = ai.definePrompt({
    name: 'createJobFromPrompt',
    input: {schema: z.object({prompt: CreateJobFromPromptInputSchema, currentDate: z.string()})},
    output: {schema: CreateJobFromPromptOutputSchema},
    prompt: `You are an expert dispatcher for Logan's Excavating. Your task is to parse a natural language request and create a structured job object.

Today's date is {{{currentDate}}}. Use this as a reference for relative dates like "tomorrow" or "next week". For example, if today is 2024-07-15, "next Monday" would be 2024-07-22.

Analyze the following prompt and extract the details for the job. Infer job names from the description if not explicitly provided. Ensure all dates are in 'YYYY-MM-DD' format. If a monetary value for the job is not mentioned in the prompt, omit the 'jobValue' field entirely from your response.

Prompt:
"{{{prompt}}}"

Provide your response in the structured output format.`,
});

const createJobFromPromptFlow = ai.defineFlow(
  {
    name: 'createJobFromPromptFlow',
    inputSchema: CreateJobFromPromptInputSchema,
    outputSchema: CreateJobFromPromptOutputSchema,
  },
  async (promptText) => {
    const {output} = await prompt({
        prompt: promptText,
        currentDate: format(new Date(), 'yyyy-MM-dd')
    });
    return output!;
  }
);
