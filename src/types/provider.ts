export type ProviderListItem = {
  id: number;
  slug: string;
  business_name: string | null;
  tagline: string | null;
  service_types: string[];
  languages_offered: string[];
  average_rating: number | null;
  total_reviews: number | null;
  location_display: string;
  free_consultation: boolean;
  serves_remote: boolean;
  serves_in_person: boolean;
  years_experience: number | null;
  user: null | {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  };
};

export type ProviderDetail = ProviderListItem & {
  bio: string | null;
  description: string | null;
  hourly_rate: string | number | null;
  consultation_fee: string | number | null;
  pricing_model: string | null;
  accepting_clients: boolean;
  is_featured: boolean;
  reviews: Array<{
    uuid: string;
    rating: number;
    body: string | null;
    created_at: string | null;
    user: null | {
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    };
  }>;
  profile_feed: any[];
};

