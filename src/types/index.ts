
export type Attraction = {
  title: string;
  description: string;
  category: string;
  address?: string;
};

export type Place = Attraction & {
  placeId: string;
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  website?: string;
  internationalPhoneNumber?: string;
  openingHours?: {
    open_now?: boolean;
    periods?: any[];
    weekday_text?: string[];
  };
  priceLevel?: number;
};

export type ItineraryItem = Place & {
  id: string; // Unique ID for the to-do list
};


export type SavedList = {
  itinerary: ItineraryItem[];
  searchResults: Place[];
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
