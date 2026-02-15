
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SummarizeDocumentInputSchema, SummarizeDocumentOutputSchema } from './summarize-document-schema';

export async function summarizeDocument(input: z.infer<typeof SummarizeDocumentInputSchema>): Promise<z.infer<typeof SummarizeDocumentOutputSchema>> {

    /* import DEFAULT_MODEL if not present, but for now assuming it might be needed or string 'gemini-1.5-flash' */
    const llmResponse = await ai.generate({
        prompt: [
            {
                text: `Analyze the following document image. Extract a concise title and a one-sentence summary.

      Document:` },
            { media: { url: input.documentDataUri } },
            { text: `Provide the output in the requested JSON format.` }
        ],
        model: 'gemini-1.5-flash',
        output: {
            format: 'json',
            schema: SummarizeDocumentOutputSchema,
        },
    });

    const output = llmResponse.output;
    if (!output) {
        throw new Error("AI failed to summarize document.");
    }
    return output;
}
