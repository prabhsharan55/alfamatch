-- ============================================================
-- AlfaMatch — 20 Realistic Indian Creator Seed Profiles
-- Run in Supabase SQL Editor → paste all → Run
-- ============================================================

-- ── 1. Kavya Reddy — Hyderabad, Beauty & Lifestyle, Micro ────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'kavya-reddy',
  'Kavya Reddy',
  'Beauty & lifestyle for Telugu girls | Hyderabad',
  'I create relatable beauty content for South Indian skin tones — honest reviews, budget finds, and occasional lifestyle vlogs. My audience is 22–32 working women from Hyderabad, Vijayawada, and Bengaluru.',
  'https://i.pravatar.cc/400?img=47',
  'Hyderabad', 'Telangana',
  array['Telugu','English','Hindi'],
  array['Beauty','Skincare','Lifestyle'],
  55200, 7.9, 'micro', true, 92, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@kavya.reddy.beauty', 42000, true  from public.creator_profiles where slug = 'kavya-reddy' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@kavyareddy',         13200, false from public.creator_profiles where slug = 'kavya-reddy' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  16000 from public.creator_profiles where slug = 'kavya-reddy' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  10000 from public.creator_profiles where slug = 'kavya-reddy' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  4000 from public.creator_profiles where slug = 'kavya-reddy' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 28000 from public.creator_profiles where slug = 'kavya-reddy' on conflict do nothing;

-- ── 2. Vikram Singh — Delhi, Fitness & Wellness, Macro ───────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'vikram-singh',
  'Vikram Singh',
  'Strength training & desi nutrition | Delhi',
  'Ex-national level weightlifter turned fitness educator. I help Indian men build sustainable strength using local foods and minimal equipment. Straight talk, no supplement scams.',
  'https://i.pravatar.cc/400?img=12',
  'Delhi', 'Delhi',
  array['Hindi','English'],
  array['Fitness','Nutrition','Wellness','Sports'],
  182000, 5.4, 'macro', true, 95, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@vikram.lifts',   98000, true  from public.creator_profiles where slug = 'vikram-singh' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@vikramfitness', 84000, true  from public.creator_profiles where slug = 'vikram-singh' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  45000 from public.creator_profiles where slug = 'vikram-singh' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  30000 from public.creator_profiles where slug = 'vikram-singh' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 80000 from public.creator_profiles where slug = 'vikram-singh' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_short', 20000 from public.creator_profiles where slug = 'vikram-singh' on conflict do nothing;

-- ── 3. Zara Khan — Jaipur, Fashion & Ethnic Wear, Micro ─────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'zara-khan',
  'Zara Khan',
  'Fusion ethnic wear & block print | Jaipur',
  'Styling Indian women in fusion ethnic wear — from block print co-ords to lehenga alternatives. I collaborate with Jaipur artisans and D2C labels celebrating local craft.',
  'https://i.pravatar.cc/400?img=44',
  'Jaipur', 'Rajasthan',
  array['Hindi','Rajasthani','English'],
  array['Fashion','Ethnic Wear','Lifestyle'],
  38400, 8.6, 'micro', false, 88, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@zara.rajputani', 38400, false from public.creator_profiles where slug = 'zara-khan' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  12000 from public.creator_profiles where slug = 'zara-khan' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   8000 from public.creator_profiles where slug = 'zara-khan' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  3000 from public.creator_profiles where slug = 'zara-khan' on conflict do nothing;

-- ── 4. Ananya Krishnan — Chennai, Skincare, Micro ────────────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'ananya-krishnan',
  'Ananya Krishnan',
  'Tamil skincare diaries & clean beauty | Chennai',
  'Pharmacist-turned-beauty creator debunking skincare myths for Indian skin. I test products for 45+ days before recommending. Preferred partner for clean and Ayurvedic beauty brands.',
  'https://i.pravatar.cc/400?img=48',
  'Chennai', 'Tamil Nadu',
  array['Tamil','English'],
  array['Beauty','Skincare','Wellness'],
  42600, 9.1, 'micro', true, 90, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@ananya.skin', 42600, true from public.creator_profiles where slug = 'ananya-krishnan' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  13000 from public.creator_profiles where slug = 'ananya-krishnan' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   8500 from public.creator_profiles where slug = 'ananya-krishnan' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  3500 from public.creator_profiles where slug = 'ananya-krishnan' on conflict do nothing;

-- ── 5. Siddharth Joshi — Pune, Finance & Business, Micro ─────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'siddharth-joshi',
  'Siddharth Joshi',
  'Personal finance for young India | Pune',
  'CA helping millennials understand SIPs, term insurance, and tax saving in plain Marathi and Hindi. No jargon, just actionable money advice. Partner with fintech and BFSI brands.',
  'https://i.pravatar.cc/400?img=15',
  'Pune', 'Maharashtra',
  array['Marathi','Hindi','English'],
  array['Finance','Business','Investing'],
  22800, 6.3, 'micro', false, 85, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@sid.finances', 22800, false from public.creator_profiles where slug = 'siddharth-joshi' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@siddharthjoshi', 8400, false from public.creator_profiles where slug = 'siddharth-joshi' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',   8000 from public.creator_profiles where slug = 'siddharth-joshi' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   5000 from public.creator_profiles where slug = 'siddharth-joshi' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 18000 from public.creator_profiles where slug = 'siddharth-joshi' on conflict do nothing;

-- ── 6. Sneha Patel — Ahmedabad, Food & Lifestyle, Micro ──────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'sneha-patel',
  'Sneha Patel',
  'Gujarati thali & home kitchen hacks | Ahmedabad',
  'Making traditional Gujarati cooking accessible for working families. I also cover kitchen gadgets, meal-prep, and occasional restaurant roundups in Ahmedabad.',
  'https://i.pravatar.cc/400?img=49',
  'Ahmedabad', 'Gujarat',
  array['Gujarati','Hindi','English'],
  array['Food','Recipes','Lifestyle'],
  41200, 8.8, 'micro', false, 87, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@sneha.rasoi',   32000, false from public.creator_profiles where slug = 'sneha-patel' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@snehacooks',    9200, false from public.creator_profiles where slug = 'sneha-patel' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  11000 from public.creator_profiles where slug = 'sneha-patel' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   7500 from public.creator_profiles where slug = 'sneha-patel' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 20000 from public.creator_profiles where slug = 'sneha-patel' on conflict do nothing;

-- ── 7. Dev Kapoor — Noida, Tech & Gaming, Micro ──────────────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'dev-kapoor',
  'Dev Kapoor',
  'Gaming setups & PC builds under ₹50K | Noida',
  'Helping Indian gamers build the best setup on a realistic budget. Reviews, benchmarks, and honest takes on peripherals, GPUs, and gaming laptops available in India.',
  'https://i.pravatar.cc/400?img=8',
  'Noida', 'Uttar Pradesh',
  array['Hindi','English'],
  array['Tech','Gaming','Reviews'],
  73400, 6.8, 'micro', true, 91, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@devgaming',     58000, true  from public.creator_profiles where slug = 'dev-kapoor' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@dev.kapoor.pc', 15400, false from public.creator_profiles where slug = 'dev-kapoor' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 30000 from public.creator_profiles where slug = 'dev-kapoor' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_short',  8000 from public.creator_profiles where slug = 'dev-kapoor' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  18000 from public.creator_profiles where slug = 'dev-kapoor' on conflict do nothing;

-- ── 8. Meera Iyer — Bangalore, Yoga & Wellness, Nano ─────────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'meera-iyer',
  'Meera Iyer',
  'Morning yoga & mindful living | Bangalore',
  '200-hr certified yoga teacher sharing 15-minute morning flows for busy Bangaloreans. I also cover Ayurvedic home remedies and mental wellness — work with wellness D2C and supplement brands.',
  'https://i.pravatar.cc/400?img=51',
  'Bangalore', 'Karnataka',
  array['Kannada','English','Hindi'],
  array['Yoga','Wellness','Lifestyle','Fitness'],
  8200, 12.4, 'nano', false, 78, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@meera.yoga.blr', 8200, false from public.creator_profiles where slug = 'meera-iyer' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  4000 from public.creator_profiles where slug = 'meera-iyer' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  2500 from public.creator_profiles where slug = 'meera-iyer' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story', 1200 from public.creator_profiles where slug = 'meera-iyer' on conflict do nothing;

-- ── 9. Rahul Banerjee — Kolkata, Travel & Photography, Micro ─────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'rahul-banerjee',
  'Rahul Banerjee',
  'Budget travel & visual storytelling | Kolkata',
  'Travel photographer exploring Northeast India and Bangladesh on tight budgets. I cover hidden destinations, street photography, and honest guesthouse reviews. Partner with travel accessories and luggage brands.',
  'https://i.pravatar.cc/400?img=18',
  'Kolkata', 'West Bengal',
  array['Bengali','English','Hindi'],
  array['Travel','Photography','Lifestyle'],
  34600, 7.2, 'micro', false, 82, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@rahul.frames',  34600, false from public.creator_profiles where slug = 'rahul-banerjee' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  10000 from public.creator_profiles where slug = 'rahul-banerjee' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   7000 from public.creator_profiles where slug = 'rahul-banerjee' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  2800 from public.creator_profiles where slug = 'rahul-banerjee' on conflict do nothing;

-- ── 10. Pooja Malhotra — Delhi, Parenting & Lifestyle, Micro ─────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'pooja-malhotra',
  'Pooja Malhotra',
  'Real talk on Indian parenting & toddler life | Delhi',
  'Mom of two sharing unfiltered parenting moments — screen time battles, desi weaning recipes, and honest reviews of baby gear that actually works in Indian homes. Partner with baby and kids brands.',
  'https://i.pravatar.cc/400?img=52',
  'Delhi', 'Delhi',
  array['Hindi','English'],
  array['Parenting','Lifestyle','Baby'],
  19400, 10.8, 'micro', false, 80, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@pooja.momlife', 19400, false from public.creator_profiles where slug = 'pooja-malhotra' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  7000 from public.creator_profiles where slug = 'pooja-malhotra' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  4500 from public.creator_profiles where slug = 'pooja-malhotra' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story', 2000 from public.creator_profiles where slug = 'pooja-malhotra' on conflict do nothing;

-- ── 11. Karan Oberoi — Mumbai, Comedy & Entertainment, Macro ─────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'karan-oberoi',
  'Karan Oberoi',
  'Desi office humor & Mumbai life | Mumbai',
  'Stand-up comic turned content creator making short-form sketches about Indian office culture, Bollywood clichés, and Mumbai local life. Worked with OTT platforms and FMCG brands on native content.',
  'https://i.pravatar.cc/400?img=11',
  'Mumbai', 'Maharashtra',
  array['Hindi','English','Marathi'],
  array['Comedy','Entertainment','Lifestyle'],
  245000, 4.8, 'macro', true, 94, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@karan.oberoi',   145000, true  from public.creator_profiles where slug = 'karan-oberoi' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@karanoberoi',   100000, true  from public.creator_profiles where slug = 'karan-oberoi' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  80000  from public.creator_profiles where slug = 'karan-oberoi' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  50000  from public.creator_profiles where slug = 'karan-oberoi' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 120000 from public.creator_profiles where slug = 'karan-oberoi' on conflict do nothing;

-- ── 12. Tanvi Mehta — Surat, Wedding & Bridal, Micro ─────────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'tanvi-mehta',
  'Tanvi Mehta',
  'Bridal looks & wedding planning for Gujarati brides | Surat',
  'Makeup artist and bridal content creator helping Gujarati brides look their best. Covers outfit inspo, jewellery, mehndi trends, and vendor recommendations across Surat and Ahmedabad.',
  'https://i.pravatar.cc/400?img=53',
  'Surat', 'Gujarat',
  array['Gujarati','Hindi','English'],
  array['Bridal','Wedding','Fashion','Beauty'],
  31800, 9.5, 'micro', false, 88, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@tanvi.bridal', 31800, false from public.creator_profiles where slug = 'tanvi-mehta' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  10000 from public.creator_profiles where slug = 'tanvi-mehta' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   6500 from public.creator_profiles where slug = 'tanvi-mehta' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  2500 from public.creator_profiles where slug = 'tanvi-mehta' on conflict do nothing;

-- ── 13. Nikhil Sharma — Gurugram, Finance & Investing, Micro ─────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'nikhil-sharma',
  'Nikhil Sharma',
  'Stocks, mutual funds & crypto for Indian millennials | Gurugram',
  'SEBI-registered investment advisor breaking down equity investing, crypto basics, and real estate for salaried Indians aged 25–35. 4 years, zero paid pump & dump. Partner with regulated fintech products only.',
  'https://i.pravatar.cc/400?img=22',
  'Gurugram', 'Haryana',
  array['Hindi','English'],
  array['Finance','Investing','Business'],
  67200, 5.9, 'micro', true, 93, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@nikhil.invests', 45000, true  from public.creator_profiles where slug = 'nikhil-sharma' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@nikhilmoney',   22200, false from public.creator_profiles where slug = 'nikhil-sharma' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  20000 from public.creator_profiles where slug = 'nikhil-sharma' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  13000 from public.creator_profiles where slug = 'nikhil-sharma' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 38000 from public.creator_profiles where slug = 'nikhil-sharma' on conflict do nothing;

-- ── 14. Simran Kaur — Chandigarh, Ethnic Fashion & Makeup, Micro ─────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'simran-kaur',
  'Simran Kaur',
  'Punjabi fashion, makeup & chai reviews | Chandigarh',
  'Fashion and makeup creator celebrating Punjabi culture through phulkari dupattas, bold kajal, and everything vibrant. My community loves festive looks and honest kurti brand reviews.',
  'https://i.pravatar.cc/400?img=54',
  'Chandigarh', 'Punjab',
  array['Punjabi','Hindi','English'],
  array['Fashion','Ethnic Wear','Beauty','Lifestyle'],
  46400, 8.2, 'micro', false, 86, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@simran.kaur.style', 46400, false from public.creator_profiles where slug = 'simran-kaur' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  14000 from public.creator_profiles where slug = 'simran-kaur' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   9000 from public.creator_profiles where slug = 'simran-kaur' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  3500 from public.creator_profiles where slug = 'simran-kaur' on conflict do nothing;

-- ── 15. Aditya Kumar — Bangalore, Photography & Street Style, Micro ──────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'aditya-kumar',
  'Aditya Kumar',
  'Urban photography & men''s street style | Bangalore',
  'Documentary photographer and men''s fashion creator based in Koramangala. I shoot city stories and style casual-to-smart looks for the modern Bengaluru guy. Collab with menswear, sneakers, and lifestyle brands.',
  'https://i.pravatar.cc/400?img=25',
  'Bangalore', 'Karnataka',
  array['Kannada','Hindi','English'],
  array['Fashion','Photography','Lifestyle','Men'],
  28200, 7.6, 'micro', false, 84, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@aditya.frames', 28200, false from public.creator_profiles where slug = 'aditya-kumar' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  9000 from public.creator_profiles where slug = 'aditya-kumar' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  6000 from public.creator_profiles where slug = 'aditya-kumar' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story', 2500 from public.creator_profiles where slug = 'aditya-kumar' on conflict do nothing;

-- ── 16. Priyanka Rao — Hyderabad, Food Vlogging, Nano ────────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'priyanka-rao',
  'Priyanka Rao',
  'Hyderabad street food & home cooking | Hyderabad',
  'Taking you through Hyderabad''s best irani cafes, biryani joints, and street stalls. Also drops quick weeknight recipes for working Telugu households.',
  'https://i.pravatar.cc/400?img=55',
  'Hyderabad', 'Telangana',
  array['Telugu','Hindi','English'],
  array['Food','Recipes','Travel'],
  5800, 14.2, 'nano', false, 75, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@priyanka.eats.hyd', 5800, false from public.creator_profiles where slug = 'priyanka-rao' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  3000 from public.creator_profiles where slug = 'priyanka-rao' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  2000 from public.creator_profiles where slug = 'priyanka-rao' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  800 from public.creator_profiles where slug = 'priyanka-rao' on conflict do nothing;

-- ── 17. Harsh Agarwal — Jaipur, Business & Entrepreneurship, Micro ────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'harsh-agarwal',
  'Harsh Agarwal',
  'Startup stories & small business growth | Jaipur',
  'First-gen entrepreneur helping tier 2 India build profitable businesses. Covers dropshipping, franchise models, and social media marketing for small budgets. Works with SaaS and B2B tools.',
  'https://i.pravatar.cc/400?img=32',
  'Jaipur', 'Rajasthan',
  array['Hindi','Rajasthani','English'],
  array['Business','Finance','Entrepreneurship'],
  54800, 6.4, 'micro', false, 87, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@harsh.biz',    38000, false from public.creator_profiles where slug = 'harsh-agarwal' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@harshagarwal', 16800, false from public.creator_profiles where slug = 'harsh-agarwal' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  16000 from public.creator_profiles where slug = 'harsh-agarwal' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  10000 from public.creator_profiles where slug = 'harsh-agarwal' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 28000 from public.creator_profiles where slug = 'harsh-agarwal' on conflict do nothing;

-- ── 18. Nisha Thomas — Kochi, Sustainable Living, Nano ───────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'nisha-thomas',
  'Nisha Thomas',
  'Zero-waste living & sustainable Kerala home | Kochi',
  'Transitioning my Kochi home to zero waste, one swap at a time. I cover composting, bamboo products, refill stores, and local sustainable brands — aimed at Kerala''s eco-conscious households.',
  'https://i.pravatar.cc/400?img=56',
  'Kochi', 'Kerala',
  array['Malayalam','English'],
  array['Sustainability','Lifestyle','Home'],
  7200, 13.6, 'nano', false, 76, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@nisha.zerowasteblr', 7200, false from public.creator_profiles where slug = 'nisha-thomas' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  3500 from public.creator_profiles where slug = 'nisha-thomas' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',  2200 from public.creator_profiles where slug = 'nisha-thomas' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  900 from public.creator_profiles where slug = 'nisha-thomas' on conflict do nothing;

-- ── 19. Aryan Kapoor — Delhi, Gaming & Tech, Micro ───────────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'aryan-kapoor',
  'Aryan Kapoor',
  'Mobile gaming & BGMI tips | Delhi',
  'Top 500 BGMI player sharing daily tips, loadout guides, and honest phone reviews for mobile gamers. Huge community of hardcore and casual gamers from North India.',
  'https://i.pravatar.cc/400?img=6',
  'Delhi', 'Delhi',
  array['Hindi','English'],
  array['Gaming','Tech','Entertainment'],
  89000, 7.1, 'micro', true, 90, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@aryan.gaming',    62000, true  from public.creator_profiles where slug = 'aryan-kapoor' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@aryan.kapoor.gg', 27000, false from public.creator_profiles where slug = 'aryan-kapoor' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 32000 from public.creator_profiles where slug = 'aryan-kapoor' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_short',  8000 from public.creator_profiles where slug = 'aryan-kapoor' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  20000 from public.creator_profiles where slug = 'aryan-kapoor' on conflict do nothing;

-- ── 20. Rhea Desai — Mumbai, Fashion & OOTDs, Macro ──────────────────────────
insert into public.creator_profiles
  (slug, display_name, headline, bio, avatar_url, city, state, languages, categories,
   total_followers, avg_engagement_rate, tier, verified, profile_completion, accepting_inquiries)
values (
  'rhea-desai',
  'Rhea Desai',
  'Contemporary Indian fashion & OOTDs | Mumbai',
  'Mumbai-based fashion creator blending Indian and western aesthetics for the modern woman. Known for accessible styling tips on a budget, featuring both fast fashion and indie Indian labels.',
  'https://i.pravatar.cc/400?img=57',
  'Mumbai', 'Maharashtra',
  array['Hindi','Marathi','English'],
  array['Fashion','Lifestyle','Beauty'],
  320000, 4.2, 'macro', true, 96, true
) on conflict (slug) do nothing;

insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'instagram', '@rhea.desai',    280000, true from public.creator_profiles where slug = 'rhea-desai' on conflict (creator_id, platform) do nothing;
insert into public.social_channels (creator_id, platform, handle, followers, verified) select id, 'youtube',   '@rheadesaivlog', 40000, true from public.creator_profiles where slug = 'rhea-desai' on conflict (creator_id, platform) do nothing;

insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_reel',  120000 from public.creator_profiles where slug = 'rhea-desai' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_post',   80000 from public.creator_profiles where slug = 'rhea-desai' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'ig_story',  25000 from public.creator_profiles where slug = 'rhea-desai' on conflict do nothing;
insert into public.rate_cards (creator_id, deliverable, price_inr) select id, 'yt_video', 180000 from public.creator_profiles where slug = 'rhea-desai' on conflict do nothing;

-- ── Verify ────────────────────────────────────────────────────────────────────
select
  cp.display_name,
  cp.city,
  cp.tier,
  cp.total_followers,
  cp.avg_engagement_rate,
  count(distinct sc.id) as channels,
  count(distinct rc.id) as rate_cards
from public.creator_profiles cp
left join public.social_channels sc on sc.creator_id = cp.id
left join public.rate_cards      rc on rc.creator_id = cp.id
group by cp.id
order by cp.total_followers desc;
