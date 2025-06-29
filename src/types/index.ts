export type Attraction = {
  title: string;
  description: string;
  category: string;
  address?: string;
};

export type ItineraryItem = Attraction & {
  id: string;
};
