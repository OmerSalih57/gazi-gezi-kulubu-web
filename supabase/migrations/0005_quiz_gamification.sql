  -- Gazi Gezgin bilgi yarışması.
  -- Supabase SQL Editor'da çalıştırın. Dosya yeniden çalıştırılınca yeni soruları ekler,
  -- süre ve doğru sayısı sınırlarını on iki soruya çıkarır, görülen soru geçmişini kurar.

  create table if not exists public.quiz_questions (
    id uuid primary key default gen_random_uuid(),
    question_text text not null,
    options jsonb not null,
    correct_option_index integer not null check (correct_option_index >= 0 and correct_option_index <= 3),
    category text not null,
    image_url text
  );

  create table if not exists public.quiz_scores (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    score integer not null check (score >= 0),
    correct_count integer not null check (correct_count >= 0 and correct_count <= 12),
    time_taken_seconds integer not null check (time_taken_seconds >= 1 and time_taken_seconds <= 260),
    created_at timestamptz not null default now()
  );

  create index if not exists quiz_scores_user_idx on public.quiz_scores (user_id, score desc);
  create index if not exists quiz_scores_created_idx on public.quiz_scores (created_at desc);

  alter table public.quiz_questions enable row level security;
  alter table public.quiz_scores enable row level security;

  drop policy if exists quiz_scores_read on public.quiz_scores;
  create policy quiz_scores_read
    on public.quiz_scores
    for select
    to anon, authenticated
    using (true);

  grant select on table public.quiz_scores to anon, authenticated;

  do $$
  declare
    r record;
  begin
    for r in
      select con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      where nsp.nspname = 'public'
        and rel.relname = 'quiz_scores'
        and con.contype = 'c'
        and (
          pg_get_constraintdef(con.oid) ilike '%correct_count%'
          or pg_get_constraintdef(con.oid) ilike '%time_taken_seconds%'
        )
    loop
      execute format('alter table public.quiz_scores drop constraint %I', r.conname);
    end loop;
  end $$;

  alter table public.quiz_scores
    add constraint quiz_scores_correct_count_check
    check (correct_count >= 0 and correct_count <= 12);

  alter table public.quiz_scores
    add constraint quiz_scores_time_taken_seconds_check
    check (time_taken_seconds >= 1 and time_taken_seconds <= 260);

  create table if not exists public.quiz_progress (
    user_id uuid primary key references public.profiles (id) on delete cascade,
    seen_question_ids uuid[] not null default '{}'
  );

  alter table public.quiz_progress enable row level security;

  drop policy if exists quiz_progress_own_read on public.quiz_progress;
  create policy quiz_progress_own_read
    on public.quiz_progress
    for select
    to authenticated
    using (user_id = auth.uid());

  grant select on table public.quiz_progress to authenticated;

  create or replace view public.quiz_questions_public
  with (security_invoker = false) as
  select id, question_text, options, category, image_url
  from public.quiz_questions;

  grant select on table public.quiz_questions_public to anon, authenticated;

  create or replace function public.submit_quiz(p_answers jsonb, p_time_taken_seconds integer)
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

  revoke all on function public.submit_quiz(jsonb, integer) from public;
  grant execute on function public.submit_quiz(jsonb, integer) to authenticated;

  insert into public.quiz_questions (question_text, options, correct_option_index, category)
  select seed.question_text, seed.options::jsonb, seed.correct_option_index, seed.category
  from (
    values
      ('Türkiye kaç coğrafi bölgeye ayrılır?', '["5","6","7","8"]', 2, 'Coğrafya'),
      ('Türkiye''nin başkenti hangi ildir?', '["İstanbul","Ankara","İzmir","Bursa"]', 1, 'İller'),
      ('Nüfusu en yüksek il hangisidir?', '["Ankara","İzmir","İstanbul","Bursa"]', 2, 'İller'),
      ('Yüzölçümü en büyük il hangisidir?', '["Sivas","Konya","Erzurum","Ankara"]', 1, 'Coğrafya'),
      ('Yüzölçümü en küçük il hangisidir?', '["Yalova","Bayburt","Bartın","Kilis"]', 0, 'Coğrafya'),
      ('Türkiye''nin en yüksek dağı hangisidir?', '["Erciyes","Süphan","Ağrı Dağı","Kaçkar"]', 2, 'Coğrafya'),
      ('Türkiye''nin en büyük gölü hangisidir?', '["Tuz Gölü","Van Gölü","Beyşehir Gölü","Eğirdir Gölü"]', 1, 'Coğrafya'),
      ('Peri bacaları en çok hangi ille anılır?', '["Nevşehir","Muğla","Antalya","Çanakkale"]', 0, 'Kültür'),
      ('Pamukkale travertenleri hangi ildedir?', '["Denizli","Aydın","Muğla","Burdur"]', 0, 'Kültür'),
      ('Göbeklitepe hangi ilin sınırlarındadır?', '["Mardin","Şanlıurfa","Diyarbakır","Gaziantep"]', 1, 'Kültür'),
      ('Sümela Manastırı hangi ildedir?', '["Rize","Artvin","Trabzon","Giresun"]', 2, 'Kültür'),
      ('Troya antik kenti hangi ildedir?', '["İzmir","Çanakkale","Balıkesir","Aydın"]', 1, 'Kültür'),
      ('Safranbolu evleri hangi ildedir?', '["Zonguldak","Bartın","Karabük","Kastamonu"]', 2, 'Kültür'),
      ('Baklava ve Antep fıstığı hangi ille özdeşleşmiştir?', '["Hatay","Gaziantep","Adana","Mersin"]', 1, 'Kültür'),
      ('Künefe en çok hangi ille anılır?', '["Şanlıurfa","Mardin","Hatay","Gaziantep"]', 2, 'Kültür'),
      ('Salda Gölü hangi ildedir?', '["Burdur","Isparta","Antalya","Afyonkarahisar"]', 0, 'Coğrafya'),
      ('Ani ören yeri hangi ilde kalır?', '["Ardahan","Kars","Iğdır","Ağrı"]', 1, 'Kültür'),
      ('Türkiye''de kaç il vardır?', '["79","80","81","82"]', 2, 'İller'),
      ('Uzungöl hangi ilin ilçesindedir?', '["Rize","Artvin","Trabzon","Gümüşhane"]', 2, 'Coğrafya'),
      ('Nemrut Dağı''ndaki dev heykeller hangi ildedir?', '["Adıyaman","Malatya","Şanlıurfa","Diyarbakır"]', 0, 'Kültür'),
      ('İstanbul hangi yılda fethedildi?', '["1071","1453","1517","1923"]', 1, 'Tarih'),
      ('İstanbul''u fetheden padişah kimdir?', '["Yavuz Sultan Selim","Kanuni Sultan Süleyman","Fatih Sultan Mehmet","II. Abdülhamid"]', 2, 'Tarih'),
      ('Malazgirt Meydan Muharebesi hangi yılda yapıldı?', '["1071","1299","1453","1514"]', 0, 'Tarih'),
      ('TBMM hangi tarihte açıldı?', '["19 Mayıs 1919","23 Nisan 1920","30 Ağustos 1922","29 Ekim 1923"]', 1, 'Tarih'),
      ('Cumhuriyet hangi tarihte ilan edildi?', '["23 Nisan 1920","1 Kasım 1922","24 Temmuz 1923","29 Ekim 1923"]', 3, 'Tarih'),
      ('Mustafa Kemal, Samsun''a hangi yıl çıktı?', '["1915","1919","1920","1923"]', 1, 'Tarih'),
      ('Zafer Bayramı hangi gündür?', '["18 Mart","19 Mayıs","30 Ağustos","29 Ekim"]', 2, 'Tarih'),
      ('Anıtkabir hangi ildedir?', '["İstanbul","Ankara","İzmir","Samsun"]', 1, 'Tarih'),
      ('Türkiye Cumhuriyeti''nin ilk cumhurbaşkanı kimdir?', '["İsmet İnönü","Mustafa Kemal Atatürk","Celal Bayar","Fevzi Çakmak"]', 1, 'Tarih'),
      ('Harf İnkılabı hangi yıl kabul edildi?', '["1923","1925","1928","1934"]', 2, 'Tarih'),
      ('Kadınlara milletvekili seçme ve seçilme hakkı hangi yıl tanındı?', '["1923","1926","1930","1934"]', 3, 'Tarih'),
      ('Çanakkale Deniz Zaferi hangi gündür?', '["18 Mart","23 Nisan","19 Mayıs","30 Ağustos"]', 0, 'Tarih'),
      ('Lozan Antlaşması hangi yıl imzalandı?', '["1920","1922","1923","1924"]', 2, 'Tarih'),
      ('Büyük Taarruz hangi yıl başladı?', '["1919","1920","1921","1922"]', 3, 'Tarih'),
      ('Türkiye hangi iki kıtada toprak sahibidir?', '["Avrupa ve Asya","Avrupa ve Afrika","Asya ve Afrika","Avrupa ve Amerika"]', 0, 'Coğrafya'),
      ('34 plakası hangi ilindir?', '["İzmir","Bursa","İstanbul","Ankara"]', 2, 'Plaka'),
      ('06 plakası hangi ilindir?', '["Antalya","Ankara","Eskişehir","Konya"]', 1, 'Plaka'),
      ('35 plakası hangi ilindir?', '["İzmir","Aydın","Manisa","Muğla"]', 0, 'Plaka'),
      ('16 plakası hangi ilindir?', '["Balıkesir","Bursa","Çanakkale","Kocaeli"]', 1, 'Plaka'),
      ('07 plakası hangi ilindir?', '["Muğla","Adana","Antalya","Mersin"]', 2, 'Plaka'),
      ('01 plakası hangi ilindir?', '["Adana","Adıyaman","Osmaniye","Hatay"]', 0, 'Plaka'),
      ('61 plakası hangi ilindir?', '["Rize","Ordu","Samsun","Trabzon"]', 3, 'Plaka'),
      ('42 plakası hangi ilindir?', '["Kayseri","Konya","Sivas","Aksaray"]', 1, 'Plaka'),
      ('27 plakası hangi ilindir?', '["Şanlıurfa","Hatay","Gaziantep","Kahramanmaraş"]', 2, 'Plaka'),
      ('31 plakası hangi ilindir?', '["Mersin","Hatay","Osmaniye","Adana"]', 1, 'Plaka'),
      ('26 plakası hangi ilindir?', '["Bilecik","Kütahya","Eskişehir","Afyonkarahisar"]', 2, 'Plaka'),
      ('55 plakası hangi ilindir?', '["Ordu","Samsun","Sinop","Amasya"]', 1, 'Plaka'),
      ('İskender kebap hangi ille özdeşleşmiştir?', '["Adana","Bursa","Gaziantep","Kayseri"]', 1, 'Mutfak'),
      ('Cağ kebabı hangi ille anılır?', '["Erzurum","Sivas","Kayseri","Malatya"]', 0, 'Mutfak'),
      ('Tantuni en çok hangi ille anılır?', '["Adana","Hatay","Mersin","Antalya"]', 2, 'Mutfak'),
      ('Maraş dondurması hangi ilindir?', '["Malatya","Kahramanmaraş","Gaziantep","Osmaniye"]', 1, 'Mutfak'),
      ('Pastırma en çok hangi ille anılır?', '["Kayseri","Sivas","Tokat","Yozgat"]', 0, 'Mutfak'),
      ('Leblebi hangi ille özdeşleşmiştir?', '["Çorum","Amasya","Tokat","Samsun"]', 0, 'Mutfak'),
      ('Tava ciğeri hangi ille anılır?', '["Edirne","Tekirdağ","Kırklareli","Bursa"]', 0, 'Mutfak'),
      ('Kayısısıyla ünlü il hangisidir?', '["Elazığ","Malatya","Diyarbakır","Adıyaman"]', 1, 'Mutfak'),
      ('İnciriyle ünlü il hangisidir?', '["Muğla","Aydın","İzmir","Manisa"]', 1, 'Mutfak'),
      ('Ezine peyniri hangi ildedir?', '["Balıkesir","Çanakkale","Edirne","Bursa"]', 1, 'Mutfak'),
      ('Mesir macunu hangi ille anılır?', '["Manisa","Aydın","İzmir","Denizli"]', 0, 'Mutfak'),
      ('Pişmaniye en çok hangi ille anılır?', '["Bursa","Kocaeli","Sakarya","Bolu"]', 1, 'Mutfak'),
      ('Mevlana''nın türbesi hangi ildedir?', '["Konya","Karaman","Aksaray","Kayseri"]', 0, 'Kültür'),
      ('Nasreddin Hoca''nın Akşehir''i hangi ilin ilçesidir?', '["Afyonkarahisar","Konya","Eskişehir","Ankara"]', 1, 'Kültür'),
      ('Karagöz ile Hacivat hangi şehrin gölge oyunudur?', '["İstanbul","Edirne","Bursa","Kütahya"]', 2, 'Kültür'),
      ('Hitit başkenti Hattuşa hangi ildedir?', '["Çorum","Amasya","Yozgat","Sivas"]', 0, 'Tarih'),
      ('Çatalhöyük hangi ilin sınırlarındadır?', '["Aksaray","Konya","Nevşehir","Niğde"]', 1, 'Tarih'),
      ('Efes antik kenti hangi ildedir?', '["Aydın","Muğla","İzmir","Manisa"]', 2, 'Kültür'),
      ('Selimiye Camii hangi ildedir?', '["İstanbul","Bursa","Edirne","Tekirdağ"]', 2, 'Kültür'),
      ('Ayasofya hangi ildedir?', '["Bursa","Edirne","İstanbul","Kocaeli"]', 2, 'Kültür'),
      ('Türkiye''nin sınırları içindeki en uzun nehir hangisidir?', '["Fırat","Dicle","Kızılırmak","Sakarya"]', 2, 'Coğrafya'),
      ('Türkiye''nin en kuzey ucu İnceburun hangi ildedir?', '["Kastamonu","Sinop","Samsun","Zonguldak"]', 1, 'Coğrafya'),
      ('Nemrut Krater Gölü hangi ildedir?', '["Adıyaman","Bitlis","Van","Muş"]', 1, 'Coğrafya'),
      ('Ölüdeniz hangi ildedir?', '["Antalya","Aydın","Muğla","İzmir"]', 2, 'Coğrafya'),
      ('Ayder Yaylası hangi ildedir?', '["Artvin","Trabzon","Rize","Giresun"]', 2, 'Coğrafya'),
      ('Abant Gölü hangi ildedir?', '["Bolu","Düzce","Sakarya","Zonguldak"]', 0, 'Coğrafya'),
      ('Ihlara Vadisi hangi ildedir?', '["Nevşehir","Niğde","Aksaray","Kırşehir"]', 2, 'Coğrafya'),
      ('Aspendos antik tiyatrosu hangi ildedir?', '["Muğla","Antalya","Aydın","Denizli"]', 1, 'Kültür'),
      ('Zeugma mozaikleri hangi ilde sergilenir?', '["Şanlıurfa","Gaziantep","Diyarbakır","Mardin"]', 1, 'Kültür'),
      ('Divriği Ulu Camii ve Darüşşifası hangi ildedir?', '["Erzincan","Sivas","Tunceli","Malatya"]', 1, 'Kültür'),
      ('İznik çinisi hangi ille anılır?', '["Kütahya","Bilecik","Bursa","Eskişehir"]', 2, 'Kültür'),
      ('GAP hangi bölgenin kalkınma projesidir?', '["İç Anadolu","Doğu Anadolu","Güneydoğu Anadolu","Akdeniz"]', 2, 'Coğrafya'),
      ('Galata Kulesi hangi ildedir?', '["İstanbul","İzmir","Bursa","Kocaeli"]', 0, 'Kültür')
  ) as seed(question_text, options, correct_option_index, category)
  where not exists (
    select 1 from public.quiz_questions existing
    where existing.question_text = seed.question_text
  );
