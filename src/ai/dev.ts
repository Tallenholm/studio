'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-inspection-reports.ts';
import '@/ai/flows/generate-daily-briefing.ts';
