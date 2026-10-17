-- Profil ayrıntıları, ekip başvurusu ve gezi yorumları.
-- Supabase SQL Editor'da bir kez çalıştırın. Yeniden çalıştırmak güvenlidir.

create table if not exists public.profile_details (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  tc_no text,
  student_no text,
  updated_at timestamptz not null default now()
);

alter table public.profile_details enable row level security;

drop policy if exists profile_details_own on public.profile_details;
create policy profile_details_own
  on public.profile_details
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on table public.profile_details to authenticated;

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    ) then
      new.role := old.role;
    end if;
  end if;
  new.id := old.id;
  if old.created_at is not null then
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists avatars_own_insert on storage.objects;
create policy avatars_own_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_own_update on storage.objects;
create policy avatars_own_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_own_delete on storage.objects;
create policy avatars_own_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create table if not exists public.application_settings (
  id integer primary key default 1 check (id = 1),
  is_accepting boolean not null default true,
  closing_message text not null default 'Ekip başvuruları şu anda kapalı.',
  title text not null default 'Ekip ve Temsilci Başvurusu',
  description text not null default 'Kulüp ekiplerinde görev almak için formu doldur.',
  departments jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.application_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  required boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.team_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  department_class text not null,
  student_no text not null,
  phone text not null,
  selected_departments jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now()
);

create index if not exists team_applications_status_idx on public.team_applications (status, created_at desc);

alter table public.application_settings enable row level security;
alter table public.application_questions enable row level security;
alter table public.team_applications enable row level security;

drop policy if exists application_settings_read on public.application_settings;
create policy application_settings_read
  on public.application_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists application_settings_admin on public.application_settings;
create policy application_settings_admin
  on public.application_settings
  for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists application_questions_read on public.application_questions;
create policy application_questions_read
  on public.application_questions
  for select
  to anon, authenticated
  using (true);

drop policy if exists application_questions_admin on public.application_questions;
create policy application_questions_admin
  on public.application_questions
  for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists team_applications_insert on public.team_applications;
create policy team_applications_insert
  on public.team_applications
  for insert
  to anon, authenticated
  with check (
    status = 'pending'
    and (
      (auth.uid() is null and user_id is null)
      or user_id = auth.uid()
    )
  );

drop policy if exists team_applications_own_read on public.team_applications;
create policy team_applications_own_read
  on public.team_applications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists team_applications_admin on public.team_applications;
create policy team_applications_admin
  on public.team_applications
  for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

grant select on table public.application_settings, public.application_questions to anon, authenticated;
grant insert, update, delete on table public.application_settings, public.application_questions to authenticated;
grant select, insert, update on table public.team_applications to authenticated;
grant insert on table public.team_applications to anon;

insert into public.application_settings (id, is_accepting, closing_message, title, description, departments)
values (
  1,
  true,
  'Ekip başvuruları şu anda kapalı. Yeni dönem açıldığında bu sayfadan duyuracağız.',
  'Ekip ve Temsilci Başvurusu',
  'Organizasyon, iletişim ve üye ilişkileri ekiplerinde görev almak isteyen üyeler bu formu doldurur. Yönetim kurulu soruları ve açık ekipleri panelden değiştirebilir.',
  '["Organizasyon","İletişim","Saymanlık","Sosyal Medya","Üye İlişkileri"]'::jsonb
)
on conflict (id) do nothing;

insert into public.application_questions (prompt, required, sort_order)
select seed.prompt, seed.required, seed.sort_order
from (
  values
    ('Bu kulüpte neden görev almak istiyorsun?', true, 0),
    ('Haftada bu işe ne kadar zaman ayırabilirsin?', true, 1)
) as seed(prompt, required, sort_order)
where not exists (select 1 from public.application_questions);

create table if not exists public.trip_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists trip_reviews_event_idx on public.trip_reviews (event_id, created_at desc);

alter table public.trip_reviews enable row level security;

drop policy if exists trip_reviews_read on public.trip_reviews;
create policy trip_reviews_read
  on public.trip_reviews
  for select
  to anon, authenticated
  using (true);

drop policy if exists trip_reviews_insert on public.trip_reviews;
create policy trip_reviews_insert
  on public.trip_reviews
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.events
      where events.id = event_id and events.status = 'completed'
    )
    and exists (
      select 1 from public.registrations
      where registrations.event_id = trip_reviews.event_id
        and registrations.user_id = auth.uid()
        and registrations.status = 'approved'
    )
  );

drop policy if exists trip_reviews_update on public.trip_reviews;
create policy trip_reviews_update
  on public.trip_reviews
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select on table public.trip_reviews to anon, authenticated;
grant insert, update on table public.trip_reviews to authenticated;
