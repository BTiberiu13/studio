
'use server';
/**
 * @fileOverview A flow that takes search criteria, gets initial recommendations,
 * enriches them with Google Places data, and returns a detailed list.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { deepSearchAttractions, type DeepSearchAttractionsInput } from './deep-search';
import { findPlace, getPlaceDetails, getPhotoUrl } from '@/services/google-places';
import type { Place, Attraction } from '@/types';

const DeepSearchAttractionsInputSchema = z.object({
  location: z.string().describe('The location to search for attractions.'),
  timeframe: z.string().describe('The timeframe for the search (e.g., "this weekend", "next month").'),
  travelStyle: z.enum(["Relaxed", "Traveler", "Fanatic"]).describe("The user's travel style, which determines the number of suggestions."),
});

export const generatePlaceRecommendations = ai.defineFlow(
  {
    name: 'generatePlaceRecommendations',
    inputSchema: DeepSearchAttractionsInputSchema,
    outputSchema: z.array(z.custom<Place>()),
  },
  async (input) => {
    // Step 1: Get initial recommendations from the deep search flow.
    const initialResults = await deepSearchAttractions(input);

    // Step 2: Concurrently enrich each recommendation with Google Places data.
    const enrichedPlaces = await Promise.all(
      initialResults.results.map(async (attraction: Attraction): Promise<Place | null> => {
        try {
          // Step 2a: Find the place ID using a text search.
          const findPlaceResponse = await findPlace(
            `${attraction.title}, ${input.location}`
          );

          if (findPlaceResponse.data.status !== 'OK' || !findPlaceResponse.data.candidates.length) {
            console.warn(`Could not find place ID for: ${attraction.title}`);
            return null;
          }

          const placeId = findPlaceResponse.data.candidates[0].place_id;
          if (!placeId) return null;

          // Step 2b: Get detailed information using the place ID.
          const detailsResponse = await getPlaceDetails(placeId);
          if (detailsResponse.data.status !== 'OK' || !detailsResponse.data.result) {
            console.warn(`Could not get details for place ID: ${placeId}`);
            return null;
          }
          const details = detailsResponse.data.result;

          // Step 2c: Construct the final enriched Place object.
          const place: Place = {
            ...attraction, // Keep original title, description, category
            placeId: details.place_id || placeId,
            address: details.formatted_address || attraction.address,
            rating: details.rating,
            userRatingsTotal: details.user_ratings_total,
            website: details.website,
            internationalPhoneNumber: details.international_phone_number,
            openingHours: details.opening_hours,
            priceLevel: details.price_level,
            photoUrl: details.photos?.[0]?.photo_reference
              ? await getPhotoUrl(details.photos[0].photo_reference, 800)
              : undefined,
          };
          
          return place;

        } catch (error) {
          console.error(`Failed to enrich place "${attraction.title}":`, error);
          return null;
        }
      })
    );

    // Filter out any null results from failed enrichment attempts.
    return enrichedPlaces.filter((p): p is Place => p !== null);
  }
);
