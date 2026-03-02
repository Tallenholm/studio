
'use server';

/**
 * @fileoverview A Genkit flow that answers user questions about the application
 * based on a provided FAQ dataset. It tailors answers to the user's role.
 */

import { ai, DEFAULT_MODEL } from '@/ai/genkit';
import { z } from 'zod';
import { faqs } from '@/lib/faq-data';
import { AnswerHelpQuestionInputSchema } from './answer-help-question-schema';
import type { AnswerHelpQuestionInput } from './answer-help-question-schema';



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

    const formatFaqs = (list: { question: string, answer: string }[]) => list.map(f => `- Question: ${f.question}\n  Answer: ${f.answer}`).join('\n');

    const prompt = `You are an expert AI assistant for the Logan's Excavating application. Your role is to answer user questions about how to use the app.

    Use the following Frequently Asked Questions (FAQ) as your primary source of truth. Do not make up functionality. If the answer is not in the FAQ, say that you cannot answer the question and suggest contacting support.

    Keep your answers concise and easy to understand.

    USER's ROLE: ${input.role}

    USER's QUESTION:
    "${input.question}"

    FAQ DATA:
    ${formatFaqs(relevantFaqs.common)}
    ${formatFaqs(relevantFaqs.employee)}
    ${formatFaqs(relevantFaqs.manager)}
    ${formatFaqs(relevantFaqs.owner)}
    `;

    const llmResponse = await ai.generate({
      prompt,
      model: DEFAULT_MODEL,
    });

    return llmResponse.text;
  }
);


export async function answerHelpQuestion(input: AnswerHelpQuestionInput): Promise<string> {
  return answerHelpQuestionFlow(input);
}
