
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-inspection-reports.ts';
import '@/ai/flows/generate-daily-briefing.ts';
import '@/ai/flows/create-job-from-prompt.ts';
import '@/ai/flows/answer-help-question.ts';
import '@/ai/flows/extract-receipt-data.ts';
import '@/ai/flows/summarize-document.ts';
