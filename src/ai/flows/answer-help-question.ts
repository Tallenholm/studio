
'use server';

/**
 * @fileoverview A Genkit flow that answers user questions about the application
 * based on a provided FAQ dataset. It tailors answers to the user's role.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit/zod';
import { faqs } from '@/lib/faq-data';
import type { UserRole } from '@/lib/types';


export const AnswerHelpQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s question about the application.'),
  role: z.string().describe('The role of the user asking the question (e.g., owner, manager, employee).'),
});

export type AnswerHelpQuestionInput = z.infer<typeof AnswerHelpQuestionInputSchema>;

const answerHelpQuestionPrompt = ai.definePrompt(
  {
    name: 'answerHelpQuestionPrompt',
    inputSchema: AnswerHelpQuestionInputSchema,
    prompt: `You are an expert AI assistant for the Logan's Excavating application. Your role is to answer user questions about how to use the app.

    Use the following Frequently Asked Questions (FAQ) as your primary source of truth. Do not make up functionality. If the answer is not in the FAQ, say that you cannot answer the question and suggest contacting support.

    Keep your answers concise and easy to understand.

    USER's ROLE: {{{role}}}

    USER's QUESTION:
    "{{{question}}}"

    FAQ DATA:
    {{#each faqs.common}}
    - Question: {{this.question}}
      Answer: {{this.answer}}
    {{/each}}
    {{#if faqs.employee}}
    - Question: {{this.question}}
      Answer: {{this.answer}}
    {{/if}}
    {{#if faqs.manager}}
    - Question: {{this.question}}
      Answer: {{this.answer}}
    {{/if}}
    {{#if faqs.owner}}
    - Question: {{this.question}}
      Answer: {{this.answer}}
    {{/if}}
    `,
  },
);

const answerHelpQuestionFlow = ai.defineFlow(
  {
    name: 'answerHelpQuestionFlow',
    inputSchema: AnswerHelpQuestionInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // Filter FAQs based on user role
    const relevantFaqs = {
        common: faqs.common,
        employee: (input.role === 'employee' || input.role === 'manager' || input.role === 'owner') ? faqs.employee : [],
        manager: (input.role === 'manager' || input.role === 'owner') ? faqs.manager : [],
        owner: (input.role === 'owner') ? faqs.owner : [],
    };
    
    const llmResponse = await answerHelpQuestionPrompt.generate({
      input: {
        question: input.question,
        role: input.role,
        faqs: relevantFaqs,
      },
    });

    return llmResponse.text();
  }
);


export async function answerHelpQuestion(input: AnswerHelpQuestionInput): Promise<string> {
    return answerHelpQuestionFlow(input);
}
