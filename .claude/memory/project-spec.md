---
name: alfamatch-project-spec
description: AlfaMatch platform spec — positioning, schema, build order, stack decisions
metadata:
  type: project
---

India-first influencer marketplace targeting Indian SMEs and tier 2/3 creators.

**Brand:** AlfaMatch (alfamatch.com) — defined in src/lib/brand.ts, change there only.

**Positioning:**
- Currency: INR (₹), not USD
- Creators: Indian names, Indian cities (Ludhiana, Jaipur, Indore, Coimbatore), Indian languages
- Brands: Indian D2C names (fashion, beauty, food, fitness startups)
- Follower focus: nano (1k–10k) and micro (10k–100k) is the wedge
- Deal sizes: ₹5,000–₹2,00,000

**Stack:** React 19 + TanStack Start + TanStack Router (file-based) + Vite 7 + Tailwind 4 + shadcn/ui + Supabase (Postgres + Auth)

**Supabase project:** https://buqbohhvczaltfyqustf.supabase.co

**Schema (v2 — normalized, already deployed):**
- profiles (extends auth.users — role: creator|brand|admin)
- creator_profiles (slug, display_name, city, state, categories, tier, etc.)
- social_channels (platform, handle, followers, verified)
- portfolio_items
- rate_cards (deliverable, price_inr)
- brand_profiles
- campaigns (brief, budget_inr, target_categories/cities/languages)
- shortlists + shortlist_items
- inquiries (status flow: new→replied→negotiating→accepted→declined→completed)
- message_threads + messages
- deals + payments → Phase 3 ONLY, do not build yet

**MVP build order (spec-defined):**
1. Auth + role select ← NEXT
2. Creator onboarding (multi-step → creator_profiles + social_channels + rate_cards)
3. Public creator profile /creator/:slug
4. Browse + filters /browse (plain filters, NO AI yet)
5. Creator detail → Inquiry flow
6. Inquiry inbox (both sides)

**Everything else = stub pages** ("Coming soon"): contracts, reports, billing, AI matcher.
AI matcher only after ~300 real profiles exist.

**Empty states required** for every screen — new users start at zero.

**Payments (Phase 3):** Razorpay. Do not build yet.

**Why:** source-of-truth spec from Claudeinflu.pdf delivered by user.
**How to apply:** every feature decision should check against this build order and positioning.
