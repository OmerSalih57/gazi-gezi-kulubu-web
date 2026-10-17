-- Kritik işlemler için IP ve hız kaydı.
-- Supabase SQL Editor'da bir kez çalıştırın.
-- Kayıtlar 30 gün sonra silinir. Tablo istemciye kapalıdır.

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('quiz_submit', 'team_application', 'trip_registration')),
  user_id uuid,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists security_events_user_idx
  on public.security_events (action, user_id, created_at desc);
create index if not exists security_events_ip_idx
  on public.security_events (action, ip, created_at desc);

alter table public.security_events enable row level security;
revoke all on table public.security_events from public, anon, authenticated;

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

revoke all on function public.enforce_rate_limit(text, text) from public;
grant execute on function public.enforce_rate_limit(text, text) to anon, authenticated;

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

  select count(*)::integer into v_recent
  from public.security_events
  where action = v_action
    and user_id is not distinct from auth.uid()
    and created_at > now() - interval '5 seconds';

  if v_recent = 0 then
    perform public.enforce_rate_limit(v_action, null);
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.registrations') is not null then
    drop trigger if exists registrations_rate_guard on public.registrations;
    create trigger registrations_rate_guard
      before insert on public.registrations
      for each row execute function public.guard_direct_write();
  end if;

  if to_regclass('public.team_applications') is not null then
    drop trigger if exists team_applications_rate_guard on public.team_applications;
    create trigger team_applications_rate_guard
      before insert on public.team_applications
      for each row execute function public.guard_direct_write();
  end if;
end $$;

drop function if exists public.submit_quiz(jsonb, integer);

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
  v_results jsonb := '[]'::jsonb;
  v_round uuid[] := array[]::uuid[];
  v_history uuid[] := array[]::uuid[];
  v_merged uuid[] := array[]::uuid[];
  v_remaining integer := 0;
begin
  if v_user is null then
    raise exception 'Yarışmak için giriş yapmalısınız.';
  end if;

  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> 12 then
    raise exception 'Yarışma on iki sorudan oluşur.';
  end if;

  if p_time_taken_seconds is null or p_time_taken_seconds < 1 or p_time_taken_seconds > 260 then
    raise exception 'Süre geçersiz.';
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

  if v_count <> 12 then
    raise exception 'On iki soru puanlanamadı.';
  end if;

  v_score := v_correct_count * 200 + greatest(0, 240 - p_time_taken_seconds) * 5;

  perform public.enforce_rate_limit('quiz_submit', p_ip);

  insert into public.quiz_scores (user_id, score, correct_count, time_taken_seconds)
  values (v_user, v_score, v_correct_count, p_time_taken_seconds);

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

  insert into public.quiz_progress (user_id, seen_question_ids)
  values (v_user, v_merged)
  on conflict (user_id) do update
  set seen_question_ids = excluded.seen_question_ids;

  return jsonb_build_object(
    'score', v_score,
    'correct_count', v_correct_count,
    'time_taken_seconds', p_time_taken_seconds,
    'results', v_results
  );
end;
$$;

revoke all on function public.submit_quiz(jsonb, integer, text) from public;
grant execute on function public.submit_quiz(jsonb, integer, text) to authenticated;
