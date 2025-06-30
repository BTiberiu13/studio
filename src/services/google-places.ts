
'use server';
/**
 * @fileOverview A service for interacting with the Google Places API.
 */
import { Client, PlaceData, PlaceDetailsResponseData, FindPlaceByTextResponseData } from "@googlemaps/google-maps-services-js";

const client = new Client({});

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.warn("Google Maps API key is missing. The Places service will not work.");
}

/**
 * Finds a place using a text query.
 * @param query The text query to search for (e.g., "Museum of Modern Art, New York").
 * @param fields The fields to return in the response.
 * @returns The response from the Places API.
 */
export async function findPlace(query: string, fields: string[] = ['place_id', 'name']): Promise<FindPlaceByTextResponseData> {
  if (!API_KEY) throw new Error("Google Maps API key is missing.");
  
  return client.findPlaceFromText({
    params: {
      input: query,
      inputtype: 'textquery',
      fields: fields,
      key: API_KEY,
    },
  });
}

/**
 * Gets detailed information about a place using its Place ID.
 * @param placeId The Place ID of the location.
 * @param fields The fields to return in the response.
 * @returns The detailed information about the place.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponseData> {
  if (!API_KEY) throw new Error("Google Maps API key is missing.");

  return client.placeDetails({
    params: {
      place_id: placeId,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'website',
        'international_phone_number',
        'rating',
        'user_ratings_total',
        'price_level',
        'opening_hours',
        'photos'
      ],
      key: API_KEY,
    },
  });
}

/**
 * Constructs a photo URL from a photo reference.
 * @param photoReference The photo reference from the Places API response.
 * @param maxWidth The maximum width of the photo.
 * @returns The full URL of the photo.
 */
export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    if (!API_KEY) return "";
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${API_KEY}`;
}
