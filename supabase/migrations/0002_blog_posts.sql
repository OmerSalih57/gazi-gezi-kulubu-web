-- Blog ve gezi rehberleri.
-- Supabase SQL Editor'da bir kez çalıştırın. Tablo yoksa /blog ve /yonetim/blog boş kalır.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null default '',
  cover_image text,
  category text not null default 'Rehber',
  author_id uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc);

create index if not exists blog_posts_category_idx
  on public.blog_posts (category);

alter table public.blog_posts enable row level security;

drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read
  on public.blog_posts
  for select
  to anon, authenticated
  using (published_at is not null and published_at <= now());

drop policy if exists blog_posts_admin_all on public.blog_posts;
create policy blog_posts_admin_all
  on public.blog_posts
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;
