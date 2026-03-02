
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { SummarizeDocumentInputSchema, SummarizeDocumentOutputSchema } from './summarize-document-schema';
import { DEFAULT_MODEL } from '@/ai/genkit';

export async function summarizeDocument(input: z.infer<typeof SummarizeDocumentInputSchema>): Promise<z.infer<typeof SummarizeDocumentOutputSchema>> {

    const llmResponse = await ai.generate({
        prompt: [
            {
                text: `Analyze the following document image. Extract a concise title and a one-sentence summary.

      Document:` },
            { media: { url: input.documentDataUri } },
            { text: `Provide the output in the requested JSON format.` }
        ],
        model: DEFAULT_MODEL,
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
