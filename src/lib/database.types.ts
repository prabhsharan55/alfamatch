export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole        = 'creator' | 'brand' | 'admin';
export type CreatorTier     = 'nano' | 'micro' | 'macro' | 'mega';
export type SocialPlatform  = 'instagram' | 'youtube' | 'tiktok' | 'x';
export type DeliverableType = 'ig_post' | 'ig_reel' | 'ig_story' | 'yt_video' | 'yt_short' | 'tiktok';
export type CampaignStatus  = 'draft' | 'live' | 'negotiating' | 'completed';
export type InquiryStatus   = 'new' | 'replied' | 'negotiating' | 'accepted' | 'declined' | 'completed';

export interface Database {
  public: {
    Tables: {

      profiles: {
        Row:           { id: string; role: UserRole; phone: string | null; created_at: string };
        Insert:        { id: string; role?: UserRole; phone?: string | null };
        Update:        { id?: string; role?: UserRole; phone?: string | null };
        Relationships: [];
      };
      creator_profiles: {
        Row: {
          id: string; user_id: string | null; slug: string; display_name: string;
          headline: string | null; bio: string | null; avatar_url: string | null;
          city: string | null; state: string | null; languages: string[] | null;
          categories: string[] | null; total_followers: number; avg_engagement_rate: number;
          tier: CreatorTier | null; verified: boolean; profile_completion: number;
          accepting_inquiries: boolean; created_at: string;
        };
        Insert: {
          user_id?: string | null; slug: string; display_name: string;
          headline?: string | null; bio?: string | null; avatar_url?: string | null;
          city?: string | null; state?: string | null; languages?: string[] | null;
          categories?: string[] | null; total_followers?: number; avg_engagement_rate?: number;
          tier?: CreatorTier | null; verified?: boolean; profile_completion?: number;
          accepting_inquiries?: boolean;
        };
        Update: {
          user_id?: string | null; slug?: string; display_name?: string;
          headline?: string | null; bio?: string | null; avatar_url?: string | null;
          city?: string | null; state?: string | null; languages?: string[] | null;
          categories?: string[] | null; total_followers?: number; avg_engagement_rate?: number;
          tier?: CreatorTier | null; verified?: boolean; profile_completion?: number;
          accepting_inquiries?: boolean;
        };
        Relationships: [];
      };
      social_channels: {
        Row: {
          id: string; creator_id: string; platform: SocialPlatform;
          handle: string; followers: number; verified: boolean; last_synced_at: string | null;
        };
        Insert: {
          creator_id: string; platform: SocialPlatform; handle: string;
          followers?: number; verified?: boolean; last_synced_at?: string | null;
        };
        Update: {
          creator_id?: string; platform?: SocialPlatform; handle?: string;
          followers?: number; verified?: boolean; last_synced_at?: string | null;
        };
        Relationships: [];
      };
      portfolio_items: {
        Row: {
          id: string; creator_id: string; title: string; platform: SocialPlatform | null;
          media_url: string | null; views: number; engagement_rate: number | null; posted_at: string | null;
        };
        Insert: {
          creator_id: string; title: string; platform?: SocialPlatform | null;
          media_url?: string | null; views?: number; engagement_rate?: number | null; posted_at?: string | null;
        };
        Update: {
          creator_id?: string; title?: string; platform?: SocialPlatform | null;
          media_url?: string | null; views?: number; engagement_rate?: number | null; posted_at?: string | null;
        };
        Relationships: [];
      };
      rate_cards: {
        Row:           { id: string; creator_id: string; deliverable: DeliverableType; price_inr: number; notes: string | null };
        Insert:        { creator_id: string; deliverable: DeliverableType; price_inr: number; notes?: string | null };
        Update:        { creator_id?: string; deliverable?: DeliverableType; price_inr?: number; notes?: string | null };
        Relationships: [];
      };
      brand_profiles: {
        Row: {
          id: string; user_id: string | null; company_name: string; logo_url: string | null;
          industry: string | null; website: string | null; city: string | null; created_at: string;
        };
        Insert: {
          user_id?: string | null; company_name: string; logo_url?: string | null;
          industry?: string | null; website?: string | null; city?: string | null;
        };
        Update: {
          user_id?: string | null; company_name?: string; logo_url?: string | null;
          industry?: string | null; website?: string | null; city?: string | null;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string; brand_id: string; name: string; brief: string | null;
          status: CampaignStatus; budget_inr: number | null; target_categories: string[] | null;
          target_cities: string[] | null; target_languages: string[] | null;
          min_followers: number | null; max_followers: number | null; created_at: string;
        };
        Insert: {
          brand_id: string; name: string; brief?: string | null; status?: CampaignStatus;
          budget_inr?: number | null; target_categories?: string[] | null;
          target_cities?: string[] | null; target_languages?: string[] | null;
          min_followers?: number | null; max_followers?: number | null;
        };
        Update: {
          brand_id?: string; name?: string; brief?: string | null; status?: CampaignStatus;
          budget_inr?: number | null; target_categories?: string[] | null;
          target_cities?: string[] | null; target_languages?: string[] | null;
          min_followers?: number | null; max_followers?: number | null;
        };
        Relationships: [];
      };
      shortlists: {
        Row:           { id: string; brand_id: string; campaign_id: string | null; name: string; created_at: string };
        Insert:        { brand_id: string; campaign_id?: string | null; name: string };
        Update:        { brand_id?: string; campaign_id?: string | null; name?: string };
        Relationships: [];
      };
      shortlist_items: {
        Row:           { id: string; shortlist_id: string; creator_id: string; added_at: string };
        Insert:        { shortlist_id: string; creator_id: string };
        Update:        { shortlist_id?: string; creator_id?: string };
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string; campaign_id: string | null; brand_id: string; creator_id: string;
          status: InquiryStatus; offer_inr: number | null; created_at: string;
        };
        Insert: {
          campaign_id?: string | null; brand_id: string; creator_id: string;
          status?: InquiryStatus; offer_inr?: number | null;
        };
        Update: {
          campaign_id?: string | null; brand_id?: string; creator_id?: string;
          status?: InquiryStatus; offer_inr?: number | null;
        };
        Relationships: [];
      };
      message_threads: {
        Row:           { id: string; inquiry_id: string; created_at: string };
        Insert:        { inquiry_id: string };
        Update:        { inquiry_id?: string };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string; thread_id: string; sender_user_id: string | null;
          body: string; sent_at: string; read_at: string | null;
        };
        Insert:        { thread_id: string; sender_user_id?: string | null; body: string; read_at?: string | null };
        Update:        { thread_id?: string; sender_user_id?: string | null; body?: string; read_at?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row types
export type CreatorProfileRow = Database['public']['Tables']['creator_profiles']['Row'];
export type SocialChannelRow  = Database['public']['Tables']['social_channels']['Row'];
export type RateCardRow       = Database['public']['Tables']['rate_cards']['Row'];
export type PortfolioItemRow  = Database['public']['Tables']['portfolio_items']['Row'];
export type BrandProfileRow   = Database['public']['Tables']['brand_profiles']['Row'];
export type CampaignRow       = Database['public']['Tables']['campaigns']['Row'];
export type InquiryRow        = Database['public']['Tables']['inquiries']['Row'];
export type MessageRow        = Database['public']['Tables']['messages']['Row'];
