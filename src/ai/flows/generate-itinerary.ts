'use server';
/**
 * @fileOverview A flow that generates an optimized daily itinerary from a list of activities.
 *
 * - generateItinerary - A function that handles the itinerary generation process.
 * - GenerateItineraryInput - The input type for the generateItinerary function.
 * - GenerateItineraryOutput - The return type for the generateItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateItineraryInputSchema = z.object({
  itineraryJson: z.string().describe('A JSON string representing the list of activities to schedule.'),
  timeframe: z.object({
    from: z.string().describe('The start date of the trip in ISO format.'),
    to: z.string().describe('The end date of the trip in ISO format.'),
  }),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

const GeneratedActivitySchema = z.object({
    title: z.string(),
    description: z.string(),
    startTime: z.string().describe("The estimated start time for the activity (e.g., '10:00 AM')."),
    endTime: z.string().describe("The estimated end time for the activity (e.g., '12:00 PM')."),
    category: z.string(),
    address: z.string().optional(),
});

const GenerateItineraryOutputSchema = z.object({
    dailyPlans: z.array(
        z.object({
            day: z.number().describe("The day number, starting from 1."),
            date: z.string().describe("The specific date for this day's plan."),
            activities: z.array(GeneratedActivitySchema).describe("A list of scheduled activities for the day."),
        })
    ).describe("The full itinerary, broken down by day."),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;


export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: {schema: GenerateItineraryInputSchema},
  output: {schema: GenerateItineraryOutputSchema},
  prompt: `You are an expert travel planner. Your task is to create a detailed, optimized daily itinerary based on a list of user-selected activities and a given timeframe.

**Constraints & Rules:**
1.  **Geographical Optimization:** Group activities for each day based on their proximity to minimize travel time. Use the provided addresses to make logical groupings.
2.  **Temporal Optimization:** Allocate a reasonable amount of time for each activity. Provide estimated start and end times for each. Be realistic about travel between locations.
3.  **Restaurant Rule:** Include a maximum of ONE activity from the 'Restaurants' category per day.
4.  **Bar Rule:** If an activity from the 'Bar' or 'Bars' category is included, it MUST be the last activity of that day. Include a maximum of ONE bar per day.
5.  **Activity Pacing:** Distribute the activities evenly across the available days. Avoid making any single day too crowded or too empty.
6.  **Overload Handling:** If the list contains too many activities to fit reasonably within the timeframe, prioritize the most interesting and diverse options. It's okay if not all activities from the input list are used.
7.  **Output Format:** Your final output must be a single JSON object that strictly adheres to the provided output schema. For each day, provide a 'day' number (starting from 1), the 'date', and a list of 'activities'. Each activity must have a 'title', 'description', 'startTime', 'endTime', 'category', and optional 'address'.

**User's Data:**
Timeframe: From {{{timeframe.from}}} to {{{timeframe.to}}}

Selected Activities (JSON string):
{{{itineraryJson}}}
  `,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
