'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExtractReceiptInputSchema = z.object({
  receiptDataUri: z.string().describe("An image of a receipt as a data URI (e.g., 'data:image/jpeg;base64,...')."),
});

const ExtractReceiptOutputSchema = z.object({
  amount: z.number().describe('The total amount found on the receipt.'),
  date: z.string().describe('The date found on the receipt in YYYY-MM-DD format. Today is ' + new Date().toLocaleDateString('en-CA')),
  description: z.string().describe('A brief summary of the items or the merchant name from the receipt.'),
});

export async function extractReceiptData(input: z.infer<typeof ExtractReceiptInputSchema>): Promise<z.infer<typeof ExtractReceiptOutputSchema>> {
  
    const extractPrompt = ai.definePrompt({
        name: 'extractReceiptPrompt',
        inputSchema: ExtractReceiptInputSchema,
        output: {
            format: 'json',
            schema: ExtractReceiptOutputSchema,
        },
        prompt: `Analyze the following receipt image. Extract the total amount, the date, and a short description (like the merchant name or key items).

        Receipt:
        {{media url=receiptDataUri}}
        
        Provide the output in the requested JSON format.`,
    });

  const llmResponse = await extractPrompt.generate({ input });
  return llmResponse.output()!;
}
