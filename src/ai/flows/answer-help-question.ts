'use server';
/**
 * @fileOverview A Genkit flow for answering user questions about the application.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { faqs } from '@/lib/faq-data';

type Role = 'owner' | 'manager' | 'employee' | 'guest';

const AnswerHelpQuestionInputSchema = z.object({
  question: z.string().describe("The user's question about the application."),
  role: z.enum(['owner', 'manager', 'employee', 'guest']).describe("The role of the user asking the question."),
});
export type AnswerHelpQuestionInput = z.infer<typeof AnswerHelpQuestionInputSchema>;

const AnswerHelpQuestionOutputSchema = z.string();
export type AnswerHelpQuestionOutput = z.infer<typeof AnswerHelpQuestionOutputSchema>;

export async function answerHelpQuestion(input: AnswerHelpQuestionInput): Promise<AnswerHelpQuestionOutput> {
  return answerHelpQuestionFlow(input);
}

const buildContextForRole = (role: Role): string => {
  let combinedFaqs = [...faqs.common];

  if (role === 'employee' || role === 'manager' || role === 'owner') {
    combinedFaqs = [...combinedFaqs, ...faqs.employee];
  }
  if (role === 'manager' || role === 'owner') {
    combinedFaqs = [...combinedFaqs, ...faqs.manager];
  }
  if (role === 'owner') {
    combinedFaqs = [...combinedFaqs, ...faqs.owner];
  }

  return combinedFaqs.map(faq => `- Question: ${faq.question}\n- Answer: ${faq.answer}`).join('\n\n');
}

const prompt = ai.definePrompt({
    name: 'answerHelpQuestionPrompt',
    input: {schema: z.object({ question: z.string(), context: z.string() })},
    output: {schema: AnswerHelpQuestionOutputSchema},
    prompt: `You are a helpful AI assistant for the "Logan's Excavating" application. Your only goal is to answer user questions about how to use the app.

Base your answer *exclusively* on the provided context below. Do not use any outside knowledge. If the answer is not in the context, politely state that you cannot answer the question. Keep your answers concise and to the point.

CONTEXT:
{{{context}}}

USER QUESTION:
"{{{question}}}"

ANSWER:`,
});

const answerHelpQuestionFlow = ai.defineFlow(
  {
    name: 'answerHelpQuestionFlow',
    inputSchema: AnswerHelpQuestionInputSchema,
    outputSchema: AnswerHelpQuestionOutputSchema,
  },
  async ({ question, role }) => {
    const context = buildContextForRole(role);
    const {output} = await prompt({ question, context });
    return output!;
  }
);
