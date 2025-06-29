
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
};

export type SavedListData = SavedList & {
  id: string;
  name: string;
};
