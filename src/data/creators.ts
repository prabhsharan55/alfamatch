export type Creator = {
  id: string;    // slug — used for URL routing
  dbId?: string; // creator_profiles.id UUID — used for Supabase writes
  name: string;
  handle: string;
  niche: string;
  followers: string;
  engagement: string;
  img: string;
  tagline: string;
  bio: string;
  location: string;
  languages: string[];
  rating: number;
  matchScore: number;
  startingRate: string;
  responseTime: string;
  verified: boolean;
  audience: { label: string; value: number }[];
  demographics: { age: string; pct: number }[];
  channels: {
    platform: "Instagram" | "TikTok" | "YouTube" | "X" | "Twitch";
    handle: string;
    followers: string;
    engagement: string;
    url: string;
  }[];
  tags: string[];
  pastBrands: string[];
  content: { type: "image" | "video"; src: string; title: string; views: string }[];
  testimonials: { brand: string; quote: string; author: string }[];
};
