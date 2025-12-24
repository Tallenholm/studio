
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { SummarizeDocumentInputSchema, SummarizeDocumentOutputSchema } from './summarize-document-schema';

export async function summarizeDocument(input: z.infer<typeof SummarizeDocumentInputSchema>): Promise<z.infer<typeof SummarizeDocumentOutputSchema>> {
  
    const summarizePrompt = ai.definePrompt({
        name: 'summarizeDocumentPrompt',
        inputSchema: SummarizeDocumentInputSchema,
        output: {
            format: 'json',
            schema: SummarizeDocumentOutputSchema,
        },
        prompt: `Analyze the following document image. Extract a concise title and a one-sentence summary.

        Document:
        {{media url=documentDataUri}}
        
        Provide the output in the requested JSON format.`,
    });

  const llmResponse = await summarizePrompt.generate({ input });
  return llmResponse.output()!;
}
