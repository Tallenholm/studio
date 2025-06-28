
'use server';
/**
 * @fileOverview A Genkit flow for summarizing an uploaded document.
 *
 * This flow analyzes a document image and suggests a concise title and a
 * one-sentence description, which can then be used to pre-fill form fields.
 *
 * @remarks
 * - summarizeDocument - The main function to trigger the summarization flow.
 * - SummarizeDocumentInput - The input type for the summarizeDocument function.
 * - SummarizeDocumentOutput - The output type for the summarizeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "An image of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;

const SummarizeDocumentOutputSchema = z.object({
  title: z.string().describe('A concise, accurate title for the document based on its content.'),
  description: z.string().describe('A one-sentence summary of the document\'s purpose or content.'),
});
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;

export async function summarizeDocument(input: SummarizeDocumentInput): Promise<SummarizeDocumentOutput> {
  return summarizeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDocumentPrompt',
  input: {schema: SummarizeDocumentInputSchema},
  output: {schema: SummarizeDocumentOutputSchema},
  prompt: `You are an AI assistant. Analyze the content of this document image. Suggest a concise, accurate title (e.g., "Vehicle Registration 2024", "Invoice from City Hardware") and a one-sentence summary of its purpose.

Document Image:
{{media url=documentDataUri}}`,
});

const summarizeDocumentFlow = ai.defineFlow(
  {
    name: 'summarizeDocumentFlow',
    inputSchema: SummarizeDocumentInputSchema,
    outputSchema: SummarizeDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
