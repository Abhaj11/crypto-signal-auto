
import { configureGenkit } from 'genkit';
import { nextjs } from '@genkit-ai/next';
import { googleAI } from '@genkit-ai/googleai';

configureGenkit({
  plugins: [
    nextjs(),
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
