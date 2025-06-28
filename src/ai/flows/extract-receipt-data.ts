
'use server';
/**
 * @fileOverview A Genkit flow for extracting structured data from a receipt image using OCR.
 *
 * This flow takes a data URI of a receipt image and uses an AI model to extract
 * the total amount, transaction date, and a brief description or merchant name.
 *
 * @remarks
 * - extractReceiptData - The main function to trigger the OCR flow.
 * - ExtractReceiptDataInput - The input type for the extractReceiptData function.
 * - ExtractReceiptDataOutput - The output type for the extractReceiptData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {format} from 'date-fns';

const ExtractReceiptDataInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "An image of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDataInput = z.infer<typeof ExtractReceiptDataInputSchema>;

const ExtractReceiptDataOutputSchema = z.object({
  amount: z.number().optional().describe('The total amount found on the receipt. Should be a number.'),
  date: z.string().optional().describe("The date of the transaction in 'YYYY-MM-DD' format."),
  description: z.string().optional().describe('A brief description of the expense or the merchant name from the receipt.'),
});
export type ExtractReceiptDataOutput = z.infer<typeof ExtractReceiptDataOutputSchema>;

export async function extractReceiptData(input: ExtractReceiptDataInput): Promise<ExtractReceiptDataOutput> {
  return extractReceiptDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractReceiptDataPrompt',
  input: {schema: z.object({ receiptDataUri: z.string(), currentDate: z.string() })},
  output: {schema: ExtractReceiptDataOutputSchema},
  prompt: `You are an expert OCR assistant. Your task is to analyze the provided receipt image and extract the following information:
- The total amount of the transaction. Find the largest, most prominent number that likely represents the final total.
- The date of the transaction.
- A brief description of the merchant or the items purchased.

Today's date is {{{currentDate}}}. Use this as a reference if the year is not specified on the receipt.

Please format the date as 'YYYY-MM-DD'. If any piece of information cannot be determined with high confidence, omit the corresponding field from your response.

Receipt Image:
{{media url=receiptDataUri}}`,
});

const extractReceiptDataFlow = ai.defineFlow(
  {
    name: 'extractReceiptDataFlow',
    inputSchema: ExtractReceiptDataInputSchema,
    outputSchema: ExtractReceiptDataOutputSchema,
  },
  async ({ receiptDataUri }) => {
    const {output} = await prompt({
        receiptDataUri,
        currentDate: format(new Date(), 'yyyy-MM-dd')
    });
    return output!;
  }
);
