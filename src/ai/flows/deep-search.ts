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
  travelStyle: z.enum(["Relaxed", "Traveler", "Fanatic"]).describe("The user's travel style, which determines the number of suggestions."),
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
  prompt: `You are an expert travel consultant tasked with creating a curated list of recommendations for a user.

Based on the user's input for location, timeframe, and travel style, you will generate a list of suggestions.

You must provide recommendations from ALL of the following categories:
- Attractions (e.g., landmarks, monuments)
- Experiences (e.g., tours, classes)
- Points of Interest (e.g., scenic viewpoints, unique districts)
- Restaurants
- Bars
- Local Hidden Gems

The number of recommendations you provide for EACH category MUST be determined by the user's Travel Style:
- For "Relaxed" style: Provide exactly 5 recommendations per category.
- For "Traveler" style: Provide exactly 10 recommendations per category.
- For "Fanatic" style: Provide exactly 15 recommendations per category.

User's query details:
Location: {{{location}}}
Timeframe: {{{timeframe}}}
Travel Style: {{{travelStyle}}}

Your final output must be a single JSON object. This object should adhere to the provided output schema. Ensure each item in the 'results' array has a 'title', 'description', 'category', and an optional 'address'. The 'category' field for each item should accurately reflect one of the categories listed above.
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
