-- ============================================================
-- AlfaMatch — Schema v2
-- Run this in Supabase SQL Editor (replaces old creators table)
-- ============================================================

-- 0. Drop old flat table
drop table if exists public.creators cascade;

-- ============================================================
-- 1. Enums
-- ============================================================
do $$ begin create type user_role       as enum ('creator','brand','admin');       exception when duplicate_object then null; end $$;
do $$ begin create type creator_tier    as enum ('nano','micro','macro','mega');    exception when duplicate_object then null; end $$;
do $$ begin create type social_platform as enum ('instagram','youtube','tiktok','x'); exception when duplicate_object then null; end $$;
do $$ begin create type deliverable_type as enum ('ig_post','ig_reel','ig_story','yt_video','yt_short','tiktok'); exception when duplicate_object then null; end $$;
do $$ begin create type campaign_status as enum ('draft','live','negotiating','completed'); exception when duplicate_object then null; end $$;
do $$ begin create type inquiry_status  as enum ('new','replied','negotiating','accepted','declined','completed'); exception when duplicate_object then null; end $$;

-- ============================================================
-- 2. profiles (thin extension of auth.users)
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       user_role not null default 'creator',
  phone      text,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. creator_profiles
-- user_id nullable so seed data works before auth is live
-- ============================================================
create table if not exists public.creator_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid unique references public.profiles(id) on delete cascade,
  slug                 text unique not null,
  display_name         text not null,
  headline             text,
  bio                  text,
  avatar_url           text,
  city                 text,
  state                text,
  languages            text[],
  categories           text[],
  total_followers      int default 0,
  avg_engagement_rate  numeric(5,2) default 0,
  tier                 creator_tier,
  verified             bool default false,
  profile_completion   int default 0 check (profile_completion between 0 and 100),
  accepting_inquiries  bool default true,
  created_at           timestamptz default now()
);

create index if not exists idx_creator_profiles_categories on public.creator_profiles using gin(categories);
create index if not exists idx_creator_profiles_city       on public.creator_profiles(city);
create index if not exists idx_creator_profiles_tier       on public.creator_profiles(tier);

-- ============================================================
-- 4. social_channels
-- ============================================================
create table if not exists public.social_channels (
  id             uuid primary key default gen_random_uuid(),
  creator_id     uuid not null references public.creator_profiles(id) on delete cascade,
  platform       social_platform not null,
  handle         text not null,
  followers      int default 0,
  verified       bool default false,
  last_synced_at timestamptz,
  unique(creator_id, platform)
);

-- ============================================================
-- 5. portfolio_items
-- ============================================================
create table if not exists public.portfolio_items (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references public.creator_profiles(id) on delete cascade,
  title           text not null,
  platform        social_platform,
  media_url       text,
  views           int default 0,
  engagement_rate numeric(5,2),
  posted_at       date
);

-- ============================================================
-- 6. rate_cards
-- ============================================================
create table if not exists public.rate_cards (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  deliverable deliverable_type not null,
  price_inr   int not null,
  notes       text,
  unique(creator_id, deliverable)
);

-- ============================================================
-- 7. brand_profiles
-- ============================================================
create table if not exists public.brand_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references public.profiles(id) on delete cascade,
  company_name text not null,
  logo_url     text,
  industry     text,
  website      text,
  city         text,
  created_at   timestamptz default now()
);

-- ============================================================
-- 8. campaigns
-- ============================================================
create table if not exists public.campaigns (
  id                 uuid primary key default gen_random_uuid(),
  brand_id           uuid not null references public.brand_profiles(id) on delete cascade,
  name               text not null,
  brief              text,
  status             campaign_status default 'draft',
  budget_inr         int,
  target_categories  text[],
  target_cities      text[],
  target_languages   text[],
  min_followers      int,
  max_followers      int,
  created_at         timestamptz default now()
);

-- ============================================================
-- 9. shortlists + shortlist_items
-- ============================================================
create table if not exists public.shortlists (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references public.brand_profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists public.shortlist_items (
  id           uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references public.shortlists(id) on delete cascade,
  creator_id   uuid not null references public.creator_profiles(id) on delete cascade,
  added_at     timestamptz default now(),
  unique(shortlist_id, creator_id)
);

-- ============================================================
-- 10. inquiries
-- ============================================================
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  brand_id    uuid not null references public.brand_profiles(id) on delete cascade,
  creator_id  uuid not null references public.creator_profiles(id) on delete cascade,
  status      inquiry_status default 'new',
  offer_inr   int,
  created_at  timestamptz default now()
);

-- ============================================================
-- 11. message_threads + messages
-- ============================================================
create table if not exists public.message_threads (
  id         uuid primary key default gen_random_uuid(),
  inquiry_id uuid unique not null references public.inquiries(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  thread_id      uuid not null references public.message_threads(id) on delete cascade,
  sender_user_id uuid references public.profiles(id) on delete set null,
  body           text not null,
  sent_at        timestamptz default now(),
  read_at        timestamptz
);

-- ============================================================
-- 12. Row Level Security
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.creator_profiles  enable row level security;
alter table public.social_channels   enable row level security;
alter table public.portfolio_items   enable row level security;
alter table public.rate_cards        enable row level security;
alter table public.brand_profiles    enable row level security;
alter table public.campaigns         enable row level security;
alter table public.shortlists        enable row level security;
alter table public.shortlist_items   enable row level security;
alter table public.inquiries         enable row level security;
alter table public.message_threads   enable row level security;
alter table public.messages          enable row level security;

-- profiles
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- creator_profiles: anyone can browse; owner can write
create policy "creator_profiles: public read" on public.creator_profiles for select using (true);
create policy "creator_profiles: own insert"  on public.creator_profiles for insert with check (user_id = auth.uid());
create policy "creator_profiles: own update"  on public.creator_profiles for update using (user_id = auth.uid());

-- social_channels / portfolio_items / rate_cards: public read, creator write
create policy "social_channels: public read" on public.social_channels for select using (true);
create policy "social_channels: own write"   on public.social_channels for all using (
  creator_id in (select id from public.creator_profiles where user_id = auth.uid())
);

create policy "portfolio_items: public read" on public.portfolio_items for select using (true);
create policy "portfolio_items: own write"   on public.portfolio_items for all using (
  creator_id in (select id from public.creator_profiles where user_id = auth.uid())
);

create policy "rate_cards: public read" on public.rate_cards for select using (true);
create policy "rate_cards: own write"   on public.rate_cards for all using (
  creator_id in (select id from public.creator_profiles where user_id = auth.uid())
);

-- brand_profiles: own only
create policy "brand_profiles: own read"   on public.brand_profiles for select using (user_id = auth.uid());
create policy "brand_profiles: own insert" on public.brand_profiles for insert with check (user_id = auth.uid());
create policy "brand_profiles: own update" on public.brand_profiles for update using (user_id = auth.uid());

-- campaigns
create policy "campaigns: own" on public.campaigns for all using (
  brand_id in (select id from public.brand_profiles where user_id = auth.uid())
);

-- shortlists
create policy "shortlists: own"      on public.shortlists      for all using (
  brand_id in (select id from public.brand_profiles where user_id = auth.uid())
);
create policy "shortlist_items: own" on public.shortlist_items for all using (
  shortlist_id in (
    select id from public.shortlists
    where brand_id in (select id from public.brand_profiles where user_id = auth.uid())
  )
);

-- inquiries: brand or creator involved
create policy "inquiries: brand read"    on public.inquiries for select using (brand_id   in (select id from public.brand_profiles   where user_id = auth.uid()));
create policy "inquiries: creator read"  on public.inquiries for select using (creator_id in (select id from public.creator_profiles where user_id = auth.uid()));
create policy "inquiries: brand insert"  on public.inquiries for insert with check (brand_id in (select id from public.brand_profiles where user_id = auth.uid()));
create policy "inquiries: brand update"  on public.inquiries for update using (brand_id   in (select id from public.brand_profiles   where user_id = auth.uid()));
create policy "inquiries: creator update" on public.inquiries for update using (creator_id in (select id from public.creator_profiles where user_id = auth.uid()));

-- message threads / messages: parties to the inquiry
create policy "threads: read" on public.message_threads for select using (
  inquiry_id in (
    select id from public.inquiries where
      brand_id   in (select id from public.brand_profiles   where user_id = auth.uid()) or
      creator_id in (select id from public.creator_profiles where user_id = auth.uid())
  )
);
create policy "threads: insert" on public.message_threads for insert with check (
  inquiry_id in (
    select id from public.inquiries where
      brand_id   in (select id from public.brand_profiles   where user_id = auth.uid()) or
      creator_id in (select id from public.creator_profiles where user_id = auth.uid())
  )
);
create policy "messages: read" on public.messages for select using (
  thread_id in (
    select mt.id from public.message_threads mt
    join   public.inquiries i on i.id = mt.inquiry_id
    where
      i.brand_id   in (select id from public.brand_profiles   where user_id = auth.uid()) or
      i.creator_id in (select id from public.creator_profiles where user_id = auth.uid())
  )
);
create policy "messages: own insert" on public.messages for insert with check (sender_user_id = auth.uid());

-- ============================================================
-- 13. Trigger: auto-create profile row on Supabase Auth signup
--     The signup form must pass { role: 'creator' | 'brand' }
--     in raw_user_meta_data.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, role)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'creator')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 14. Seed data — 5 Indian creators (user_id NULL = demo profile)
-- ============================================================

-- Priya Sharma — Jaipur, Fashion & Ethnic Wear, Micro (28K)
insert into public.creator_profiles
  (slug, display_name, headline, bio, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'priya-sharma',
  'Priya Sharma',
  'Ethnic wear & Rajasthani fashion | Jaipur',
  'Passionate about bringing Rajasthan''s rich textile heritage to modern wardrobes. I work with indie designers and D2C fashion labels who take craftsmanship seriously.',
  'Jaipur', 'Rajasthan',
  array['Hindi','Rajasthani','English'],
  array['Fashion','Ethnic Wear','Lifestyle'],
  28400, 6.8, 'micro', false, 85, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers)
select id, 'instagram', '@priya.creates', 28400 from public.creator_profiles where slug = 'priya-sharma'
on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  8000 from public.creator_profiles where slug = 'priya-sharma' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  5000 from public.creator_profiles where slug = 'priya-sharma' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story', 2500 from public.creator_profiles where slug = 'priya-sharma' on conflict do nothing;

-- Arjun Mehta — Ludhiana, Fitness, Nano (8.5K)
insert into public.creator_profiles
  (slug, display_name, headline, bio, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'arjun-mehta',
  'Arjun Mehta',
  'Home workouts & desi nutrition | Ludhiana',
  'Certified personal trainer helping Punjab''s youth build strength without a gym. Honest reviews on affordable fitness gear and local superfoods.',
  'Ludhiana', 'Punjab',
  array['Hindi','Punjabi','English'],
  array['Fitness','Wellness','Nutrition'],
  8500, 11.2, 'nano', false, 72, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers)
select id, 'youtube', '@arjunfitness', 8500 from public.creator_profiles where slug = 'arjun-mehta'
on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 12000 from public.creator_profiles where slug = 'arjun-mehta' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_short',  4000 from public.creator_profiles where slug = 'arjun-mehta' on conflict do nothing;

-- Divya Nair — Coimbatore, Food & Recipes, Micro (45K)
insert into public.creator_profiles
  (slug, display_name, headline, bio, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'divya-nair',
  'Divya Nair',
  'South Indian recipes & kitchen finds | Coimbatore',
  'Home cook turned food creator sharing authentic Tamil and Kerala recipes. I partner with kitchenware brands, organic grocery labels, and regional food startups.',
  'Coimbatore', 'Tamil Nadu',
  array['Tamil','English','Malayalam'],
  array['Food','Recipes','Lifestyle'],
  63800, 8.1, 'micro', false, 90, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers)
select id, 'instagram', '@divya.eats', 45200 from public.creator_profiles where slug = 'divya-nair'
on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers)
select id, 'youtube', '@divyaeats', 18600 from public.creator_profiles where slug = 'divya-nair'
on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  14000 from public.creator_profiles where slug = 'divya-nair' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   9000 from public.creator_profiles where slug = 'divya-nair' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 22000 from public.creator_profiles where slug = 'divya-nair' on conflict do nothing;

-- Rohit Bansal — Indore, Budget Tech Reviews, Micro (92K)
insert into public.creator_profiles
  (slug, display_name, headline, bio, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'rohit-bansal',
  'Rohit Bansal',
  'Budget tech reviews for Bharat | Indore',
  'Covering smartphones, gadgets, and apps under ₹20,000. My audience is tier 2 India — they trust my reviews because I live the same budget reality they do.',
  'Indore', 'Madhya Pradesh',
  array['Hindi','English'],
  array['Tech','Reviews','Gadgets'],
  106200, 7.4, 'micro', false, 88, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers)
select id, 'youtube', '@rohit.tech', 92000 from public.creator_profiles where slug = 'rohit-bansal'
on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers)
select id, 'instagram', '@rohit.tech.india', 14200 from public.creator_profiles where slug = 'rohit-bansal'
on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 35000 from public.creator_profiles where slug = 'rohit-bansal' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_short', 10000 from public.creator_profiles where slug = 'rohit-bansal' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  18000 from public.creator_profiles where slug = 'rohit-bansal' on conflict do nothing;

-- Neha Gupta — Delhi, Beauty & Skincare, Micro (15K)
insert into public.creator_profiles
  (slug, display_name, headline, bio, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'neha-gupta',
  'Neha Gupta',
  'Skincare for Indian skin tones | Delhi',
  'Dermat-reviewed routines built for Indian skin and climate. I only recommend products I''ve tested for 30+ days. Work with clean beauty D2C brands.',
  'Delhi', 'Delhi',
  array['Hindi','English'],
  array['Beauty','Skincare','Wellness'],
  25000, 9.3, 'micro', false, 80, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers)
select id, 'instagram', '@neha.beauty', 15800 from public.creator_profiles where slug = 'neha-gupta'
on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers)
select id, 'tiktok', '@nehabeauty', 9200 from public.creator_profiles where slug = 'neha-gupta'
on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  6000 from public.creator_profiles where slug = 'neha-gupta' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  4000 from public.creator_profiles where slug = 'neha-gupta' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story', 1500 from public.creator_profiles where slug = 'neha-gupta' on conflict do nothing;
