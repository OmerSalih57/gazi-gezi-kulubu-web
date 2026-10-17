-- 90 günden eski yarışma turlarını arşive alır, hız kayıtlarını siler.
-- Supabase SQL Editor'da bir kez çalıştırın.
-- Her kullanıcının en iyi puanı quiz_scores tablosunda kalır; liderlik bozulmaz.
-- Çağrı: select public.archive_old_data();

create table if not exists public.quiz_scores_archive (
  id uuid primary key,
  user_id uuid not null,
  score integer not null,
  correct_count integer not null,
  time_taken_seconds integer not null,
  created_at timestamptz not null,
  archived_at timestamptz not null default now()
);

create index if not exists quiz_scores_archive_user_idx
  on public.quiz_scores_archive (user_id, created_at desc);

alter table public.quiz_scores_archive enable row level security;
revoke all on table public.quiz_scores_archive from public, anon, authenticated;

create or replace function public.archive_old_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cutoff timestamptz := now() - interval '90 days';
  v_quiz integer := 0;
  v_logs integer := 0;
begin
  if to_regclass('public.quiz_scores') is not null then
    with candidates as (
      select s.id
      from public.quiz_scores s
      where s.created_at < v_cutoff
        and s.id is distinct from (
          select b.id
          from public.quiz_scores b
          where b.user_id = s.user_id
          order by b.score desc, b.time_taken_seconds asc, b.created_at desc, b.id
          limit 1
        )
    ),
    inserted as (
      insert into public.quiz_scores_archive (
        id, user_id, score, correct_count, time_taken_seconds, created_at
      )
      select s.id, s.user_id, s.score, s.correct_count, s.time_taken_seconds, s.created_at
      from public.quiz_scores s
      join candidates c on c.id = s.id
      on conflict (id) do nothing
      returning id
    ),
    removed as (
      delete from public.quiz_scores q
      using inserted i
      where q.id = i.id
      returning q.id
    )
    select count(*)::integer into v_quiz from removed;
  end if;

  if to_regclass('public.security_events') is not null then
    delete from public.security_events
    where created_at < v_cutoff;
    get diagnostics v_logs = row_count;
  end if;

  return jsonb_build_object(
    'cutoff', v_cutoff,
    'quiz_archived', v_quiz,
    'security_logs_removed', v_logs
  );
end;
$$;

revoke all on function public.archive_old_data() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.archive_old_data() to service_role;
  end if;
end $$;
