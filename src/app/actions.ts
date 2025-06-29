"use server";

import { deepSearchAttractions, type DeepSearchAttractionsInput } from "@/ai/flows/deep-search";
import type { Attraction } from "@/types";
import { z } from "zod";

const formSchema = z.object({
  location: z.string().min(1, "Location is required.").max(100),
  timeframe: z.string().min(1, "Timeframe is required.").max(50),
  interests: z.string().max(200).optional(),
});

type SearchResult = {
  data?: {
    results: Attraction[];
  };
  error?: string;
}

export async function handleSearch(data: DeepSearchAttractionsInput): Promise<SearchResult> {
  const validation = formSchema.safeParse(data);
  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message).join(' ');
    return { error: "Invalid input: " + errorMessages };
  }

  try {
    const results = await deepSearchAttractions(validation.data);
    return { data: results };
  } catch (error) {
    console.error("Deep search flow failed:", error);
    return { error: "An AI error occurred. Please try again later." };
  }
}
