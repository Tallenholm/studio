
import {z} from 'zod';

export const SummarizeDocumentInputSchema = z.object({
  documentDataUri: z.string().describe("An image of a document as a data URI (e.g., 'data:image/jpeg;base64,...')."),
});

export const SummarizeDocumentOutputSchema = z.object({
  title: z.string().describe('A short, descriptive title for the document (e.g., "2024 Vehicle Registration", "Safety Policy Update").'),
  description: z.string().describe('A one-sentence summary of the document\'s purpose or content.'),
});
