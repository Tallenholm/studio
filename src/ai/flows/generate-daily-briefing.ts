
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DailyBriefingOutputSchema, BriefingDataSchema } from './generate-daily-briefing-schema';
import type { DailyBriefingOutput, BriefingData } from './generate-daily-briefing-schema';

const generateBriefingFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefingFlow',
    inputSchema: BriefingDataSchema,
    outputSchema: DailyBriefingOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are an AI assistant for an operations manager. It is currently ${new Date().toDateString()}.
    Your task is to review the following structured data and generate a professional, concise summary for each item.
    - For 'attentionItems', the summary should be a direct, actionable alert.
    - For 'todaysAgenda', the summary should be a clear statement of what is scheduled.
    - For 'pendingActions', the summary should describe what needs to be reviewed.

    Transform the 'title' and 'details' of each item into a natural language 'summary' field.
    Return the final JSON object with the same structure, but with the 'summary' field populated.
    `;

    const llmResponse = await ai.generate({
      prompt,
      model: 'gemini-1.5-flash',
      output: {
        format: 'json',
        schema: DailyBriefingOutputSchema,
      },
      input: input,
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI response did not include a valid briefing object.');
    }
    return output;
  }
);

export async function generateDailyBriefing(input: BriefingData): Promise<DailyBriefingOutput> {
  return generateBriefingFlow(input);
}
