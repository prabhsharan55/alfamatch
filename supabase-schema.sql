-- ============================================================
-- 1. Create creators table
-- ============================================================
create table if not exists public.creators (
  id             text primary key,
  name           text not null,
  handle         text not null,
  niche          text not null,
  followers      text not null,
  engagement     text not null,
  img_url        text,
  tagline        text,
  bio            text,
  location       text,
  languages      text[],
  rating         numeric(3,2),
  match_score    integer,
  starting_rate  text,
  response_time  text,
  verified       boolean default false,
  tags           text[],
  past_brands    text[],
  audience       jsonb,
  demographics   jsonb,
  channels       jsonb,
  content        jsonb,
  testimonials   jsonb,
  created_at     timestamptz default now()
);

-- Enable Row Level Security
alter table public.creators enable row level security;

-- Allow anyone to read creators (public browse)
create policy "creators are publicly readable"
  on public.creators for select
  using (true);

-- ============================================================
-- 2. Seed data (3 creators)
-- ============================================================
insert into public.creators (
  id, name, handle, niche, followers, engagement,
  tagline, bio, location, languages,
  rating, match_score, starting_rate, response_time, verified,
  tags, past_brands, audience, demographics, channels, content, testimonials
) values
(
  'elara-voss',
  'Elara Voss',
  '@elara.voss',
  'Minimalist Tech & Design',
  '142K',
  '5.2%',
  'Quiet luxury for the digital age.',
  'Designer-turned-creator documenting the intersection of tech, taste, and slow living. Featured in Wallpaper*, Kinfolk, and on the Apple Design blog. I work with brands that respect craft.',
  'Copenhagen, DK',
  array['English','Danish','German'],
  4.9,
  97,
  '$3,200',
  '< 4h',
  true,
  array['Minimalism','Apple','Workspace','Scandi','Lifestyle Tech'],
  array['Apple','Bang & Olufsen','Muji','Aesop','Hermès'],
  '[{"label":"USA","value":38},{"label":"UK","value":21},{"label":"Germany","value":14},{"label":"Nordics","value":12},{"label":"Other","value":15}]',
  '[{"age":"18-24","pct":22},{"age":"25-34","pct":48},{"age":"35-44","pct":21},{"age":"45+","pct":9}]',
  '[{"platform":"Instagram","handle":"@elara.voss","followers":"142K","engagement":"5.2%","url":"#"},{"platform":"YouTube","handle":"@elaravoss","followers":"68K","engagement":"8.1%","url":"#"},{"platform":"TikTok","handle":"@elara.designs","followers":"210K","engagement":"11.4%","url":"#"},{"platform":"X","handle":"@elaravoss","followers":"24K","engagement":"2.1%","url":"#"}]',
  '[{"type":"image","title":"Studio at dawn","views":"84K"},{"type":"video","title":"Unboxing the new Vision Pro","views":"412K"},{"type":"image","title":"Desk setup, June","views":"61K"},{"type":"image","title":"Linen + matte glass","views":"39K"},{"type":"video","title":"A quiet workflow","views":"228K"},{"type":"image","title":"Field notes — Kyoto","views":"94K"}]',
  '[{"brand":"Aesop","quote":"Elara delivered a campaign that felt like a love letter to our brand.","author":"Mira Holm, Brand Director"},{"brand":"Bang & Olufsen","quote":"Her audience engagement was 3x our prior creator partnerships.","author":"Jonas P., Marketing Lead"}]'
),
(
  'marcus-chen',
  'Marcus Chen',
  '@marcus_builds',
  'Smart Home & Productivity',
  '890K',
  '12.8%',
  'The smart home, demystified.',
  'Software engineer breaking down smart home tech, automation, and the productivity stack that actually works. 890K creators, builders, and curious nerds trust my reviews.',
  'Austin, TX',
  array['English','Mandarin'],
  4.8,
  93,
  '$8,500',
  '< 12h',
  true,
  array['Smart Home','Automation','Reviews','Productivity','DIY'],
  array['Aqara','Ecobee','Logitech','Razer','Samsung'],
  '[{"label":"USA","value":56},{"label":"Canada","value":14},{"label":"UK","value":10},{"label":"Australia","value":8},{"label":"Other","value":12}]',
  '[{"age":"18-24","pct":18},{"age":"25-34","pct":51},{"age":"35-44","pct":24},{"age":"45+","pct":7}]',
  '[{"platform":"TikTok","handle":"@marcus_builds","followers":"890K","engagement":"12.8%","url":"#"},{"platform":"YouTube","handle":"@MarcusBuilds","followers":"412K","engagement":"9.2%","url":"#"},{"platform":"Instagram","handle":"@marcus.builds","followers":"180K","engagement":"4.8%","url":"#"},{"platform":"Twitch","handle":"marcusbuilds","followers":"44K","engagement":"—","url":"#"}]',
  '[{"type":"video","title":"I automated my entire morning","views":"2.1M"},{"type":"video","title":"Matter vs Thread, finally explained","views":"780K"},{"type":"image","title":"Lab tour","views":"112K"},{"type":"video","title":"Best $50 smart home gear","views":"1.4M"},{"type":"image","title":"Server rack glow-up","views":"210K"},{"type":"video","title":"Hands-on: Home Assistant 2026","views":"640K"}]',
  '[{"brand":"Aqara","quote":"Marcus drove a 47% lift in sales on the SKUs he featured.","author":"Lin W., Growth"},{"brand":"Ecobee","quote":"His tutorials cut our support tickets in half post-launch.","author":"D. Patel, Product"}]'
),
(
  'sarah-jensen',
  'Sarah Jensen',
  '@sarah.finds',
  'Ethical Fashion & Art',
  '2.4M',
  '3.1%',
  'Slow fashion. Loud taste.',
  'Stylist and art collector championing independent designers and ethical sourcing. 2.4M followers across platforms. I only work with brands whose supply chains I can defend.',
  'New York, NY',
  array['English','French','Spanish'],
  4.95,
  89,
  '$22,000',
  '< 24h',
  true,
  array['Sustainable','Editorial','Vintage','Art','Luxury'],
  array['Ganni','COS','Stella McCartney','MoMA','Net-a-Porter'],
  '[{"label":"USA","value":42},{"label":"France","value":16},{"label":"UK","value":12},{"label":"Japan","value":10},{"label":"Other","value":20}]',
  '[{"age":"18-24","pct":31},{"age":"25-34","pct":44},{"age":"35-44","pct":18},{"age":"45+","pct":7}]',
  '[{"platform":"YouTube","handle":"@sarah.finds","followers":"2.4M","engagement":"3.1%","url":"#"},{"platform":"Instagram","handle":"@sarah.finds","followers":"1.1M","engagement":"4.7%","url":"#"},{"platform":"TikTok","handle":"@sarahfinds","followers":"680K","engagement":"6.8%","url":"#"}]',
  '[{"type":"video","title":"A week in vintage Yamamoto","views":"3.8M"},{"type":"image","title":"Spring editorial — Marais","views":"210K"},{"type":"video","title":"Inside my archive closet","views":"1.9M"},{"type":"image","title":"Gallery hop, NYC","views":"98K"},{"type":"video","title":"Sustainable swaps that actually look good","views":"1.2M"},{"type":"image","title":"Studio visit — ceramicist","views":"74K"}]',
  '[{"brand":"Ganni","quote":"Sarah''s audience converts at 4x industry average for our price point.","author":"E. Lund, CMO"},{"brand":"MoMA","quote":"She brought a younger audience to our membership program — measurably.","author":"K. Reyes, Audience"}]'
)
on conflict (id) do nothing;
