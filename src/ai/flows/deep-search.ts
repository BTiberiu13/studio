// src/ai/flows/deep-search.ts
'use server';
/**
 * @fileOverview A flow that uses a large language model to search attractions, experiences, and points of interest.
 *
 * - deepSearchAttractions - A function that handles the deep search process.
 * - DeepSearchAttractionsInput - The input type for the deepSearchAttractions function.
 * - DeepSearchAttractionsOutput - The return type for the deepSearchAttractions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DeepSearchAttractionsInputSchema = z.object({
  location: z.string().describe('The location to search for attractions.'),
  timeframe: z.string().describe('The timeframe for the search (e.g., "this weekend", "next month").'),
  interests: z.string().optional().describe('Optional: Specific interests to filter the search (e.g., "historical sites", "outdoor activities").'),
});
export type DeepSearchAttractionsInput = z.infer<typeof DeepSearchAttractionsInputSchema>;

const DeepSearchAttractionsOutputSchema = z.object({
  results: z.array(
    z.object({
      title: z.string().describe('The title of the attraction or experience.'),
      description: z.string().describe('A brief description of the attraction or experience.'),
      category: z.string().describe('The category of the attraction (e.g., "museum", "park", "restaurant").'),
      address: z.string().optional().describe('The address of the location, if available.'),
    })
  ).describe('A list of attractions, experiences, and points of interest found for the specified location and timeframe.'),
});
export type DeepSearchAttractionsOutput = z.infer<typeof DeepSearchAttractionsOutputSchema>;

export async function deepSearchAttractions(input: DeepSearchAttractionsInput): Promise<DeepSearchAttractionsOutput> {
  return deepSearchAttractionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'deepSearchAttractionsPrompt',
  input: {schema: DeepSearchAttractionsInputSchema},
  output: {schema: DeepSearchAttractionsOutputSchema},
  prompt: `You are a travel expert helping users discover attractions, experiences, and points of interest.

  Based on the user's location, timeframe, and interests, provide a list of relevant options.

  Location: {{{location}}}
  Timeframe: {{{timeframe}}}
  Interests: {{{interests}}}

  Format the output as a JSON array of objects, each containing the title, description, category, and address (if available) of the attraction or experience.
  `,
});

const deepSearchAttractionsFlow = ai.defineFlow(
  {
    name: 'deepSearchAttractionsFlow',
    inputSchema: DeepSearchAttractionsInputSchema,
    outputSchema: DeepSearchAttractionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
