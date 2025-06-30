
export type Attraction = {
  title: string;
  description: string;
  category: string;
  address?: string;
};

export type ItineraryItem = Attraction & {
  id: string;
};

export type SavedList = {
  itinerary: ItineraryItem[];
  searchResults: Attraction[];
  timeframe?: {
    from: string; // ISO date string
    to: string;   // ISO date string
  };
};

export type SavedListData = SavedList & {
  id: string;
  name: string;
};

export type GeneratedActivity = {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  category: string;
  address?: string;
};

export type DailyPlan = {
  day: number;
  date: string;
  activities: GeneratedActivity[];
};

export type GeneratedItinerary = {
  dailyPlans: DailyPlan[];
};

export type SavedItineraryData = GeneratedItinerary & {
    id: string;
    name: string;
};

export type Place = Attraction & {
  placeId: string;
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  website?: string;
  internationalPhoneNumber?: string;
  openingHours?: string[];
  searchLocation: string;
  createdAt: string; // ISO date string
};
