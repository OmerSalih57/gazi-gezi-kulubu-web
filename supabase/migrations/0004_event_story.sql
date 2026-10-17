-- Gezi programı ve rota durakları.
-- Supabase SQL Editor'da bir kez çalıştırın.

alter table public.events
  add column if not exists itinerary jsonb not null default '[]'::jsonb,
  add column if not exists highlights jsonb not null default '[]'::jsonb;
