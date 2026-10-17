-- Gezi fotoğraf albümleri.
-- Supabase SQL Editor'da bir kez çalıştırın.

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events (id) on delete set null,
  title text not null,
  cover_image text,
  created_at timestamptz not null default now()
);

create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists albums_event_id_idx on public.albums (event_id);
create index if not exists albums_created_at_idx on public.albums (created_at desc);
create index if not exists album_photos_album_id_idx on public.album_photos (album_id, created_at);

alter table public.albums enable row level security;
alter table public.album_photos enable row level security;

drop policy if exists albums_public_read on public.albums;
create policy albums_public_read
  on public.albums
  for select
  to anon, authenticated
  using (true);

drop policy if exists album_photos_public_read on public.album_photos;
create policy album_photos_public_read
  on public.album_photos
  for select
  to anon, authenticated
  using (true);

drop policy if exists albums_admin_all on public.albums;
create policy albums_admin_all
  on public.albums
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists album_photos_admin_all on public.album_photos;
create policy album_photos_admin_all
  on public.album_photos
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

grant select on table public.albums, public.album_photos to anon, authenticated;
grant insert, update, delete on table public.albums, public.album_photos to authenticated;

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

drop policy if exists gallery_public_read on storage.objects;
create policy gallery_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'gallery');

drop policy if exists gallery_admin_insert on storage.objects;
create policy gallery_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'gallery'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists gallery_admin_update on storage.objects;
create policy gallery_admin_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'gallery'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists gallery_admin_delete on storage.objects;
create policy gallery_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'gallery'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
