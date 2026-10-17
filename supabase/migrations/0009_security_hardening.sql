-- Üretim güvenlik sıkılaştırması.
-- Supabase SQL Editor'da 0008'den sonra bir kez çalıştırın.
-- Anonim ekip başvurusunu kapatır, hız sınırında kimliksiz isteği reddeder,
-- yarışma turunu sunucuda saklar ve çekirdek tabloların satır politikasını yeniler.

create or replace function public.enforce_rate_limit(p_action text, p_ip text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ip text := left(coalesce(nullif(trim(p_ip), ''), ''), 64);
  v_user_count integer := 0;
  v_ip_count integer := 0;
  v_user_window interval := interval '10 minutes';
  v_user_limit integer := 1;
  v_ip_window interval := interval '10 minutes';
  v_ip_limit integer := 20;
begin
  if p_action not in ('quiz_submit', 'team_application', 'trip_registration') then
    raise exception 'Geçersiz işlem.';
  end if;

  if v_user is null and v_ip = '' then
    raise exception 'İstek doğrulanamadı. Lütfen yeniden deneyin.';
  end if;

  if p_action = 'quiz_submit' then
    v_user_window := interval '3 minutes';
    v_user_limit := 1;
    v_ip_window := interval '10 minutes';
    v_ip_limit := 12;
  elsif p_action = 'team_application' then
    v_user_window := interval '10 minutes';
    v_user_limit := 1;
    v_ip_window := interval '1 hour';
    v_ip_limit := 20;
  else
    v_user_window := interval '10 minutes';
    v_user_limit := 3;
    v_ip_window := interval '10 minutes';
    v_ip_limit := 20;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_action || coalesce(v_user::text, v_ip, 'anon')));

  if v_user is not null then
    select count(*)::integer into v_user_count
    from public.security_events
    where action = p_action
      and user_id = v_user
      and created_at > now() - v_user_window;
    if v_user_count >= v_user_limit then
      raise exception 'Çok sık deneme. Lütfen kısa bir süre sonra yeniden deneyin.';
    end if;
  end if;

  if v_ip <> '' then
    select count(*)::integer into v_ip_count
    from public.security_events
    where action = p_action
      and ip = v_ip
      and created_at > now() - v_ip_window;
    if v_ip_count >= v_ip_limit then
      raise exception 'Bu ağdan çok fazla istek geldi. Lütfen kısa bir süre sonra yeniden deneyin.';
    end if;
  end if;

  insert into public.security_events (action, user_id, ip)
  values (p_action, v_user, nullif(v_ip, ''));

  delete from public.security_events
  where created_at < now() - interval '30 days';
end;
$$;

create or replace function public.guard_direct_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text := case TG_TABLE_NAME
    when 'registrations' then 'trip_registration'
    when 'team_applications' then 'team_application'
    else null
  end;
  v_recent integer := 0;
begin
  if v_action is null then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'Bu işlem için giriş yapmalısınız.';
  end if;

  if TG_TABLE_NAME = 'team_applications' and new.user_id is distinct from auth.uid() then
    raise exception 'Başvuru yalnızca kendi hesabınızla gönderilebilir.';
  end if;

  select count(*)::integer into v_recent
  from public.security_events
  where action = v_action
    and user_id = auth.uid()
    and created_at > now() - interval '5 seconds';

  if v_recent = 0 then
    perform public.enforce_rate_limit(v_action, null);
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.team_applications') is not null then
    drop policy if exists team_applications_insert on public.team_applications;
    create policy team_applications_insert
      on public.team_applications
      for insert
      to authenticated
      with check (status = 'pending' and user_id = auth.uid());

    revoke insert on table public.team_applications from anon;
  end if;
end $$;

alter table public.quiz_progress
  add column if not exists active_question_ids uuid[],
  add column if not exists active_started_at timestamptz;

create or replace function public.issue_quiz_round(p_ids uuid[])
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_count integer := 0;
begin
  if v_user is null then
    raise exception 'Yarışmak için giriş yapmalısınız.';
  end if;

  if p_ids is null or cardinality(p_ids) <> 12 then
    raise exception 'Yarışma on iki sorudan oluşur.';
  end if;

  if (select count(distinct item) from unnest(p_ids) as item) <> 12 then
    raise exception 'Aynı soru iki kez gönderilemez.';
  end if;

  select count(*)::integer into v_count
  from public.quiz_questions
  where id = any (p_ids);

  if v_count <> 12 then
    raise exception 'Geçersiz soru.';
  end if;

  insert into public.quiz_progress (user_id, seen_question_ids, active_question_ids, active_started_at)
  values (v_user, array[]::uuid[], p_ids, now())
  on conflict (user_id) do update
  set active_question_ids = excluded.active_question_ids,
      active_started_at = excluded.active_started_at;

  return now();
end;
$$;

revoke all on function public.issue_quiz_round(uuid[]) from public;
grant execute on function public.issue_quiz_round(uuid[]) to authenticated;

drop function if exists public.submit_quiz(jsonb, integer);
drop function if exists public.submit_quiz(jsonb, integer, text);

create or replace function public.submit_quiz(p_answers jsonb, p_time_taken_seconds integer, p_ip text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_item record;
  v_qid uuid;
  v_choice integer;
  v_correct integer;
  v_count integer := 0;
  v_correct_count integer := 0;
  v_score integer;
  v_seconds integer;
  v_results jsonb := '[]'::jsonb;
  v_round uuid[] := array[]::uuid[];
  v_expected uuid[] := array[]::uuid[];
  v_started timestamptz;
  v_history uuid[] := array[]::uuid[];
  v_merged uuid[] := array[]::uuid[];
  v_remaining integer := 0;
  v_got uuid[];
  v_need uuid[];
begin
  if v_user is null then
    raise exception 'Yarışmak için giriş yapmalısınız.';
  end if;

  select active_question_ids, active_started_at
  into v_expected, v_started
  from public.quiz_progress
  where user_id = v_user;

  if v_started is null or v_expected is null or cardinality(v_expected) <> 12 then
    raise exception 'Tur bulunamadı.';
  end if;

  if v_started < now() - interval '30 minutes' then
    update public.quiz_progress
    set active_question_ids = null, active_started_at = null
    where user_id = v_user;
    raise exception 'Turun süresi doldu.';
  end if;

  v_seconds := greatest(1, least(260, floor(extract(epoch from (clock_timestamp() - v_started)))::integer));

  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> 12 then
    raise exception 'Yarışma on iki sorudan oluşur.';
  end if;

  for v_item in select value as answer from jsonb_array_elements(p_answers)
  loop
    v_qid := (v_item.answer->>'question_id')::uuid;
    v_choice := coalesce((v_item.answer->>'choice')::integer, -1);
    if v_qid = any (v_round) then
      raise exception 'Aynı soru iki kez gönderilemez.';
    end if;
    v_round := array_append(v_round, v_qid);

    select correct_option_index into v_correct
    from public.quiz_questions
    where id = v_qid;

    if v_correct is null then
      raise exception 'Geçersiz soru.';
    end if;

    v_count := v_count + 1;
    if v_choice = v_correct then
      v_correct_count := v_correct_count + 1;
    end if;

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'question_id', v_qid,
        'correct', v_choice = v_correct
      )
    );
  end loop;

  select coalesce(array_agg(item order by item), '{}')
  into v_got
  from unnest(v_round) as item;

  select coalesce(array_agg(item order by item), '{}')
  into v_need
  from unnest(v_expected) as item;

  if v_got is distinct from v_need then
    raise exception 'Tur doğrulanamadı.';
  end if;

  v_score := v_correct_count * 200 + greatest(0, 240 - v_seconds) * 5;

  perform public.enforce_rate_limit('quiz_submit', p_ip);

  insert into public.quiz_scores (user_id, score, correct_count, time_taken_seconds)
  values (v_user, v_score, v_correct_count, v_seconds);

  select seen_question_ids into v_history
  from public.quiz_progress
  where user_id = v_user;

  if v_history is null then
    v_history := array[]::uuid[];
  end if;

  select coalesce(array_agg(distinct item), array[]::uuid[])
  into v_merged
  from unnest(v_history || v_round) as item;

  select count(*)::integer into v_remaining
  from public.quiz_questions
  where not (id = any (v_merged));

  if v_remaining < 12 then
    v_merged := v_round;
  end if;

  update public.quiz_progress
  set seen_question_ids = v_merged,
      active_question_ids = null,
      active_started_at = null
  where user_id = v_user;

  return jsonb_build_object(
    'score', v_score,
    'correct_count', v_correct_count,
    'time_taken_seconds', v_seconds,
    'results', v_results
  );
end;
$$;

revoke all on function public.submit_quiz(jsonb, integer, text) from public;
grant execute on function public.submit_quiz(jsonb, integer, text) to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

do $$
declare
  r record;
begin
  if to_regclass('public.profiles') is not null then
    for r in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'profiles'
    loop
      execute format('drop policy if exists %I on public.profiles', r.policyname);
    end loop;

    alter table public.profiles enable row level security;

    create policy profiles_select_self_or_admin
      on public.profiles
      for select
      to authenticated
      using (id = auth.uid() or public.is_admin());

    create policy profiles_insert_self
      on public.profiles
      for insert
      to authenticated
      with check (id = auth.uid());

    create policy profiles_update_self_or_admin
      on public.profiles
      for update
      to authenticated
      using (id = auth.uid() or public.is_admin())
      with check (id = auth.uid() or public.is_admin());

    revoke all on table public.profiles from anon;
    grant select, insert, update on table public.profiles to authenticated;
  end if;

  if to_regclass('public.events') is not null then
    for r in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'events'
    loop
      execute format('drop policy if exists %I on public.events', r.policyname);
    end loop;

    alter table public.events enable row level security;

    create policy events_public_read
      on public.events
      for select
      to anon, authenticated
      using (status in ('open', 'closed', 'completed'));

    create policy events_admin_all
      on public.events
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    grant select on table public.events to anon, authenticated;
    grant insert, update, delete on table public.events to authenticated;
  end if;

  if to_regclass('public.registrations') is not null then
    for r in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'registrations'
    loop
      execute format('drop policy if exists %I on public.registrations', r.policyname);
    end loop;

    alter table public.registrations enable row level security;

    create policy registrations_own_select
      on public.registrations
      for select
      to authenticated
      using (user_id = auth.uid() or public.is_admin());

    create policy registrations_own_insert
      on public.registrations
      for insert
      to authenticated
      with check (user_id = auth.uid());

    create policy registrations_own_update
      on public.registrations
      for update
      to authenticated
      using (
        user_id = auth.uid()
        and status in ('pending_payment', 'receipt_uploaded')
      )
      with check (
        user_id = auth.uid()
        and status in ('pending_payment', 'receipt_uploaded', 'cancelled')
      );

    create policy registrations_admin_all
      on public.registrations
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    revoke all on table public.registrations from anon;
    grant select, insert, update on table public.registrations to authenticated;
  end if;
end $$;

create or replace view public.profiles_public
with (security_invoker = false) as
select id, full_name, avatar_url
from public.profiles;

grant select on table public.profiles_public to anon, authenticated;

create or replace view public.registration_occupancy
with (security_invoker = false) as
select event_id, count(*)::integer as booked
from public.registrations
where status in ('pending_payment', 'receipt_uploaded', 'approved')
group by event_id;

grant select on table public.registration_occupancy to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

update storage.buckets
set public = false
where id in ('receipts', 'dekont');

do $$
declare
  r record;
  body text;
begin
  for r in
    select pol.polname as name,
           pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
           pg_get_expr(pol.polwithcheck, pol.polrelid) as check_expr
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'storage'
      and cls.relname = 'objects'
  loop
    body := coalesce(r.using_expr, '') || ' ' || coalesce(r.check_expr, '');
    if r.name ilike '%receipt%'
       or r.name ilike '%dekont%'
       or body ilike '%receipts%'
       or body ilike '%dekont%' then
      execute format('drop policy if exists %I on storage.objects', r.name);
    end if;
  end loop;
end $$;

create policy receipts_owner_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('receipts', 'dekont')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy receipts_owner_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('receipts', 'dekont')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('receipts', 'dekont')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy receipts_owner_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('receipts', 'dekont')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy receipts_admin_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id in ('receipts', 'dekont')
    and public.is_admin()
  );

create policy receipts_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('receipts', 'dekont')
    and public.is_admin()
  );
