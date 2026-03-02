
import { z } from 'zod';


export const AnswerHelpQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s question about the application.'),
  role: z.string().describe('The role of the user asking the question (e.g., owner, manager, employee).'),
});

export type AnswerHelpQuestionInput = z.infer<typeof AnswerHelpQuestionInputSchema>;
