
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';

const SummarizeDocumentInputSchema = z.object({
  documentDataUri: z.string().describe("An image of a document as a data URI (e.g., 'data:image/jpeg;base64,...')."),
});

const SummarizeDocumentOutputSchema = z.object({
  title: z.string().describe('A short, descriptive title for the document (e.g., "2024 Vehicle Registration", "Safety Policy Update").'),
  description: z.string().describe('A one-sentence summary of the document\'s purpose or content.'),
});

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
