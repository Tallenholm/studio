/**
 * @fileoverview This file initializes the Genkit AI platform with the Google
 * AI plugin. It is the entry point for all Genkit functionality in the app.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/** Centralized model reference — change here to update all AI flows. */
export const DEFAULT_MODEL = 'gemini-2.5-flash';

export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});
