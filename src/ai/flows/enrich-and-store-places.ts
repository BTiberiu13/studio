
'use server';
/**
 * @fileOverview A flow that enriches search results with data from Google Places API and stores them.
 *
 * - enrichAndStorePlaces - A function that handles the enrichment and storage process.
 * - EnrichAndStorePlacesInput - The input type for the enrichAndStorePlaces function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getPlaceDetails } from '@/services/google-places';
import { savePlace, type Place } from '@/lib/firestore';

// Re-defining the schema here to avoid circular dependencies
const DeepSearchAttractionsInputSchema = z.object({
  location: z.string().describe('The location to search for attractions.'),
  timeframe: z.string().describe('The timeframe for the search (e.g., "this weekend", "next month").'),
  travelStyle: z.enum(["Relaxed", "Traveler", "Fanatic"]).describe("The user's travel style, which determines the number of suggestions."),
});

const EnrichAndStorePlacesInputSchema = z.object({
    searchQuery: DeepSearchAttractionsInputSchema,
    attractions: z.array(
        z.object({
            title: z.string(),
            description: z.string(),
            category: z.string(),
            address: z.string().optional(),
        })
    ),
});
export type EnrichAndStorePlacesInput = z.infer<typeof EnrichAndStorePlacesInputSchema>;


const enrichAndStorePlacesFlow = ai.defineFlow(
  {
    name: 'enrichAndStorePlacesFlow',
    inputSchema: EnrichAndStorePlacesInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    // This flow is "fire-and-forget", so it runs in the background.
    // We don't want to wait for it to complete.
    Promise.all(input.attractions.map(async (attraction) => {
        try {
            const placeDetails = await getPlaceDetails(attraction.title, input.searchQuery.location);
            if (placeDetails) {
                const placeData: Place = {
                    ...attraction,
                    ...placeDetails,
                    searchLocation: input.searchQuery.location,
                    createdAt: new Date().toISOString(),
                };
                await savePlace(placeData);
            }
        } catch (error) {
            console.error(`Failed to enrich and store place: ${attraction.title}`, error);
        }
    })).catch(err => {
        console.error("An error occurred during place enrichment background processing:", err);
    });

    // Return immediately
    return;
  }
);

// This is the exported async function wrapper that complies with 'use server'
export async function enrichAndStorePlaces(input: EnrichAndStorePlacesInput): Promise<void> {
    enrichAndStorePlacesFlow(input); // fire and forget
}
