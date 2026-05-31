-- ============================================================
-- AlfaMatch — Escrow Payments Schema
-- Run in Supabase SQL Editor after schema-v2.sql
-- ============================================================

-- Enum
do $$ begin
  create type escrow_status as enum ('pending','held','released','refunded','disputed');
exception when duplicate_object then null; end $$;

-- Table
create table if not exists public.escrow_payments (
  id                   uuid primary key default gen_random_uuid(),
  inquiry_id           uuid unique not null references public.inquiries(id) on delete cascade,
  amount_inr           int not null,
  platform_fee_inr     int not null default 0,   -- AlfaMatch 5% fee
  status               escrow_status default 'pending',
  razorpay_order_id    text,                      -- set when real Razorpay order created
  razorpay_payment_id  text,                      -- set after successful payment
  brand_paid_at        timestamptz,
  released_at          timestamptz,
  refunded_at          timestamptz,
  disputed_at          timestamptz,
  dispute_reason       text,
  created_at           timestamptz default now()
);

-- RLS
alter table public.escrow_payments enable row level security;

-- Brand can read/insert escrow for their inquiries
create policy "escrow: brand read" on public.escrow_payments for select using (
  inquiry_id in (
    select id from public.inquiries
    where brand_id in (select id from public.brand_profiles where user_id = auth.uid())
  )
);

-- Creator can read escrow for their inquiries
create policy "escrow: creator read" on public.escrow_payments for select using (
  inquiry_id in (
    select id from public.inquiries
    where creator_id in (select id from public.creator_profiles where user_id = auth.uid())
  )
);

-- Brand can insert escrow
create policy "escrow: brand insert" on public.escrow_payments for insert with check (
  inquiry_id in (
    select id from public.inquiries
    where brand_id in (select id from public.brand_profiles where user_id = auth.uid())
  )
);

-- Brand can update escrow (to trigger release/dispute)
create policy "escrow: brand update" on public.escrow_payments for update using (
  inquiry_id in (
    select id from public.inquiries
    where brand_id in (select id from public.brand_profiles where user_id = auth.uid())
  )
);

-- Creator can update escrow (for dispute)
create policy "escrow: creator update" on public.escrow_payments for update using (
  inquiry_id in (
    select id from public.inquiries
    where creator_id in (select id from public.creator_profiles where user_id = auth.uid())
  )
);

-- Verify
select 'escrow_payments table created' as status;
