import { supabase } from "./supabase";
import type { Creator } from "@/data/creators";
import type { CreatorProfileRow, SocialChannelRow, RateCardRow } from "./database.types";

type FullCreatorRow = CreatorProfileRow & {
  social_channels: SocialChannelRow[];
  rate_cards: RateCardRow[];
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function minRate(cards: RateCardRow[]): string {
  if (!cards.length) return "On request";
  const min = Math.min(...cards.map((c) => c.price_inr));
  return `₹${min.toLocaleString("en-IN")}`;
}

function rowToCreator(row: FullCreatorRow): Creator {
  const img = row.avatar_url ?? "";
  const location = [row.city, row.state].filter(Boolean).join(", ");

  return {
    id:           row.slug,
    dbId:         row.id,
    name:         row.display_name,
    handle:       row.social_channels[0]?.handle ?? `@${row.slug}`,
    niche:        row.categories?.[0] ?? "Creator",
    followers:    formatFollowers(row.total_followers),
    engagement:   `${row.avg_engagement_rate}%`,
    img,
    tagline:      row.headline ?? "",
    bio:          row.bio ?? "",
    location,
    languages:    row.languages ?? [],
    rating:       4.7,
    matchScore:   85,
    startingRate: minRate(row.rate_cards),
    responseTime: "< 24h",
    verified:     row.verified,
    audience:     [],
    demographics: [],
    channels: row.social_channels.map((ch) => ({
      platform:   ch.platform as "Instagram" | "TikTok" | "YouTube" | "X" | "Twitch",
      handle:     ch.handle,
      followers:  formatFollowers(ch.followers),
      engagement: `${row.avg_engagement_rate}%`,
      url:        "#",
    })),
    tags:         row.categories ?? [],
    pastBrands:   [],
    content:      [],
    testimonials: [],
  };
}

const CREATOR_SELECT = `
  *,
  social_channels(*),
  rate_cards(*)
` as const;

export async function getCreators(): Promise<Creator[]> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(CREATOR_SELECT)
    .eq("accepting_inquiries", true)
    .order("total_followers", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as FullCreatorRow[]).map(rowToCreator);
}

export async function getCreatorById(slugOrId: string): Promise<Creator | null> {
  const { data, error } = await supabase
    .from("creator_profiles")
    .select(CREATOR_SELECT)
    .eq("slug", slugOrId)
    .single();

  if (error) return null;
  return rowToCreator(data as FullCreatorRow);
}
