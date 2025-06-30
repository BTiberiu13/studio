
"use server";

import { deepSearchAttractions, type DeepSearchAttractionsInput } from "@/ai/flows/deep-search";
import { generateItinerary, type GenerateItineraryInput, type GenerateItineraryOutput } from "@/ai/flows/generate-itinerary";
import type { Attraction } from "@/types";
import { z } from "zod";
import { format } from "date-fns";

const formSchema = z.object({
  location: z.string().min(1, "Location is required.").max(100),
  timeframe: z.object({
    from: z.date({ required_error: "A start date is required." }),
    to: z.date({ required_error: "An end date is required." }),
  }),
  travelStyle: z.enum(["Relaxed", "Traveler", "Fanatic"], {
    required_error: "You need to select a travel style.",
  }),
});

export type SearchActionInput = z.infer<typeof formSchema>;

type SearchResult = {
  data?: {
    results: Attraction[];
  };
  error?: string;
}

export async function handleSearch(data: SearchActionInput): Promise<SearchResult> {
  const validation = formSchema.safeParse(data);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message).join(' ');
    return { error: "Invalid input: " + errorMessages };
  }

  try {
    const { location, timeframe, travelStyle } = validation.data;
    const timeframeString = `${format(timeframe.from, "PPP")} - ${format(timeframe.to, "PPP")}`;
    
    const aiInput: DeepSearchAttractionsInput = {
        location,
        timeframe: timeframeString,
        travelStyle,
    };

    const results = await deepSearchAttractions(aiInput);
    return { data: results };
  } catch (error) {
    console.error("Deep search failed:", error);
    return { error: "An AI error occurred. Please try again later." };
  }
}

type GenerateItineraryResult = {
    data?: GenerateItineraryOutput;
    error?: string;
}

export async function handleGenerateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryResult> {
    try {
        const results = await generateItinerary(input);
        return { data: results };
    } catch (error) {
        console.error("Itinerary generation failed:", error);
        return { error: "An AI error occurred while generating the itinerary. Please try again later." };
    }
}
