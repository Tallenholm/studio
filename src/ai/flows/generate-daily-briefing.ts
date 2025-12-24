
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DailyBriefingOutputSchema, DailyBriefingInputSchema } from './generate-daily-briefing-schema';
import type { DailyBriefingOutput, DailyBriefingInput } from './generate-daily-briefing-schema';

const generateBriefingFlow = ai.defineFlow(
  {
    name: 'generateDailyBriefingFlow',
    inputSchema: DailyBriefingInputSchema,
    outputSchema: DailyBriefingOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are an AI assistant for an operations manager at an excavating company. It is currently ${new Date().toDateString()}. Your task is to process the provided JSON data and create a daily briefing.

    Data provided:
    - Jobs
    - Inspection Reports
    - Time Off Requests
    - Calendar Events
    - Fleet Assets

    Categorize the information into three lists based on these rules:
    1.  **attentionItems**: High-priority items. This should exclusively be for FAILED inspection reports from the last 2 days. For each, create a summary like "Failed pre-trip report for [Asset Name] by [Employee Name]." Use the asset's name if you can find it in the assets list, otherwise use its VIN. The link should be '/admin/reports/[reportId]'.
    2.  **todaysAgenda**: Things scheduled for today. This includes active jobs and company events. For jobs, summarize as "Job: [Job Name] for [Client Name]." with link '/admin/jobs/[jobId]'. For events, summarize as "Event: [Event Title]." with link '/admin/manage-calendar'.
    3.  **pendingActions**: Items that require the manager's review and approval. This includes time off requests with a "pending" status. Summarize time off as "[Employee Name] requested time off." with link '/admin/manage-requests'.

    If a category has no items, return an empty array for it. Be concise and professional. Return the final JSON object.`;

    const llmResponse = await ai.generate({
      prompt,
      model: 'gemini-1.5-flash',
      output: {
        format: 'json',
        schema: DailyBriefingOutputSchema,
      },
      // Pass the structured data directly to the model.
      input: input,
    });

    const output = llmResponse.output();
    if (!output) {
      throw new Error('AI response did not include a valid briefing object.');
    }
    return output;
  }
);


export async function generateDailyBriefing(input: DailyBriefingInput): Promise<DailyBriefingOutput> {
  return generateBriefingFlow(input);
}
