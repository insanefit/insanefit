create table if not exists students (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  objective text not null,
  adherence integer not null default 0,
  streak integer not null default 0,
  next_session text not null,
  plan text not null,
  share_code text not null default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  student_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day text not null,
  time text not null,
  student_id text not null references students(id) on delete cascade,
  focus text not null,
  duration integer not null,
  created_at timestamptz not null default now()
);

create table if not exists exercises (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  name text not null,
  sets text not null,
  day text,
  routine text,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists exercise_videos (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_key text not null,
  raw_url text not null,
  embed_url text not null,
  license_label text,
  notes text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_key)
);

create table if not exists trainer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'studio')),
  subscription_status text not null default 'inactive' check (
    subscription_status in ('inactive', 'trialing', 'active', 'past_due', 'canceled')
  ),
  display_name text not null default '',
  coach_title text not null default 'Personal Trainer',
  coach_avatar_url text,
  phone text,
  instagram text,
  bio text,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table students add column if not exists user_id uuid;
alter table sessions add column if not exists user_id uuid;
alter table exercises add column if not exists user_id uuid;
alter table exercises add column if not exists day text;
alter table exercises add column if not exists routine text;
alter table exercise_videos add column if not exists user_id uuid;
alter table exercise_videos add column if not exists exercise_key text;
alter table exercise_videos add column if not exists raw_url text;
alter table exercise_videos add column if not exists embed_url text;
alter table exercise_videos add column if not exists license_label text;
alter table exercise_videos add column if not exists notes text;
alter table exercise_videos add column if not exists updated_at timestamptz;
alter table students add column if not exists share_code text;
alter table students add column if not exists student_user_id uuid references auth.users(id) on delete set null;
alter table students add column if not exists sex text;
alter table students add column if not exists training_level text;
alter table students add column if not exists workout_type text;
alter table students add column if not exists whatsapp text;
alter table trainer_profiles add column if not exists display_name text;
alter table trainer_profiles add column if not exists coach_title text;
alter table trainer_profiles add column if not exists coach_avatar_url text;
alter table trainer_profiles add column if not exists phone text;
alter table trainer_profiles add column if not exists instagram text;
alter table trainer_profiles add column if not exists bio text;

alter table students alter column user_id set default auth.uid();
alter table sessions alter column user_id set default auth.uid();
alter table exercises alter column user_id set default auth.uid();
alter table exercise_videos alter column user_id set default auth.uid();
alter table exercise_videos alter column updated_at set default now();
alter table students alter column share_code
  set default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

update students
set share_code = upper(substr(md5(id || clock_timestamp()::text || random()::text), 1, 8))
where share_code is null;

-- Backfill para schema normalizado sem quebrar compatibilidade do legado.
update students
set sex = next_session
where sex is null and coalesce(trim(next_session), '') <> '';

update students
set training_level = plan
where training_level is null and coalesce(trim(plan), '') <> '';

update students
set workout_type = objective
where workout_type is null and coalesce(trim(objective), '') <> '';

alter table students alter column share_code set not null;
alter table trainer_profiles alter column display_name set default '';
alter table trainer_profiles alter column coach_title set default 'Personal Trainer';
update trainer_profiles set display_name = '' where display_name is null;
update trainer_profiles set coach_title = 'Personal Trainer' where coach_title is null;
alter table trainer_profiles alter column display_name set not null;
alter table trainer_profiles alter column coach_title set not null;

update sessions s
set user_id = st.user_id
from students st
where s.student_id = st.id and s.user_id is null;

update exercises e
set user_id = st.user_id
from students st
where e.student_id = st.id and e.user_id is null;

create index if not exists students_user_id_idx on students(user_id);
create unique index if not exists students_share_code_idx on students(share_code);
create unique index if not exists students_student_user_id_idx on students(student_user_id) where student_user_id is not null;
create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_student_id_idx on sessions(student_id);
create index if not exists exercises_user_id_idx on exercises(user_id);
create index if not exists exercises_student_id_idx on exercises(student_id);
create index if not exists exercise_videos_user_id_idx on exercise_videos(user_id);
create index if not exists trainer_profiles_plan_idx on trainer_profiles(plan);

alter table students enable row level security;
alter table sessions enable row level security;
alter table exercises enable row level security;
alter table exercise_videos enable row level security;
alter table trainer_profiles enable row level security;

drop policy if exists "allow all students" on students;
drop policy if exists "allow all sessions" on sessions;
drop policy if exists "allow all exercises" on exercises;
drop policy if exists "users_select_students" on students;
drop policy if exists "users_insert_students" on students;
drop policy if exists "users_update_students" on students;
drop policy if exists "users_delete_students" on students;
drop policy if exists "users_select_sessions" on sessions;
drop policy if exists "users_insert_sessions" on sessions;
drop policy if exists "users_update_sessions" on sessions;
drop policy if exists "users_delete_sessions" on sessions;
drop policy if exists "users_select_exercises" on exercises;
drop policy if exists "users_insert_exercises" on exercises;
drop policy if exists "users_update_exercises" on exercises;
drop policy if exists "users_delete_exercises" on exercises;
drop policy if exists "users_select_exercise_videos" on exercise_videos;
drop policy if exists "users_insert_exercise_videos" on exercise_videos;
drop policy if exists "users_update_exercise_videos" on exercise_videos;
drop policy if exists "users_delete_exercise_videos" on exercise_videos;
drop policy if exists "users_select_trainer_profiles" on trainer_profiles;
drop policy if exists "users_insert_trainer_profiles" on trainer_profiles;
drop policy if exists "users_update_trainer_profiles" on trainer_profiles;
drop policy if exists "users_delete_trainer_profiles" on trainer_profiles;

create or replace function claim_student_access(input_code text)
returns table (student_id text, student_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_student students%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into target_student
  from students
  where share_code = upper(trim(input_code))
    and student_user_id is null
  limit 1;

  if not found then
    return;
  end if;

  update students
  set student_user_id = auth.uid()
  where id = target_student.id
    and student_user_id is null;

  return query
  select target_student.id, target_student.name;
end;
$$;

revoke all on function claim_student_access(text) from public;
grant execute on function claim_student_access(text) to authenticated;

create policy "users_select_students"
  on students for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = student_user_id);

create policy "users_insert_students"
  on students for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users_update_students"
  on students for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_delete_students"
  on students for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "users_select_sessions"
  on sessions for select
  to authenticated
  using (
    (
      auth.uid() = user_id
      and exists (
        select 1 from students st
        where st.id = sessions.student_id and st.user_id = auth.uid()
      )
    )
    or exists (
      select 1 from students st
      where st.id = sessions.student_id and st.student_user_id = auth.uid()
    )
  );

create policy "users_insert_sessions"
  on sessions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from students st
      where st.id = sessions.student_id and st.user_id = auth.uid()
    )
  );

create policy "users_update_sessions"
  on sessions for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from students st
      where st.id = sessions.student_id and st.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from students st
      where st.id = sessions.student_id and st.user_id = auth.uid()
    )
  );

create policy "users_delete_sessions"
  on sessions for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "users_select_exercises"
  on exercises for select
  to authenticated
  using (
    (
      auth.uid() = user_id
      and exists (
        select 1 from students st
        where st.id = exercises.student_id and st.user_id = auth.uid()
      )
    )
    or exists (
      select 1 from students st
      where st.id = exercises.student_id and st.student_user_id = auth.uid()
    )
  );

create policy "users_insert_exercises"
  on exercises for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from students st
      where st.id = exercises.student_id and st.user_id = auth.uid()
    )
  );

create policy "users_update_exercises"
  on exercises for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from students st
      where st.id = exercises.student_id and st.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from students st
      where st.id = exercises.student_id and st.user_id = auth.uid()
    )
  );

create policy "users_delete_exercises"
  on exercises for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "users_select_exercise_videos"
  on exercise_videos for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users_insert_exercise_videos"
  on exercise_videos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users_update_exercise_videos"
  on exercise_videos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_delete_exercise_videos"
  on exercise_videos for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "users_select_trainer_profiles"
  on trainer_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users_insert_trainer_profiles"
  on trainer_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users_update_trainer_profiles"
  on trainer_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_delete_trainer_profiles"
  on trainer_profiles for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Progress tracking + transactional RPCs
-- ---------------------------------------------------------------------------

create table if not exists session_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null references sessions(id) on delete cascade,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

create table if not exists student_progress_entries (
  id text primary key default substr(md5(random()::text || clock_timestamp()::text), 1, 24),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  session_id text references sessions(id) on delete set null,
  score integer not null check (score between 0 and 100),
  delta integer not null,
  source text not null default 'session_toggle',
  is_completing boolean,
  created_at timestamptz not null default now()
);

create index if not exists session_completions_user_id_idx on session_completions(user_id);
create index if not exists session_completions_session_id_idx on session_completions(session_id);
create index if not exists student_progress_entries_user_id_idx on student_progress_entries(user_id);
create index if not exists student_progress_entries_student_id_idx on student_progress_entries(student_id);
create index if not exists student_progress_entries_created_at_idx on student_progress_entries(created_at desc);

alter table session_completions enable row level security;
alter table student_progress_entries enable row level security;

drop policy if exists "users_select_session_completions" on session_completions;
drop policy if exists "users_insert_session_completions" on session_completions;
drop policy if exists "users_update_session_completions" on session_completions;
drop policy if exists "users_delete_session_completions" on session_completions;
drop policy if exists "users_select_student_progress_entries" on student_progress_entries;
drop policy if exists "users_insert_student_progress_entries" on student_progress_entries;
drop policy if exists "users_update_student_progress_entries" on student_progress_entries;
drop policy if exists "users_delete_student_progress_entries" on student_progress_entries;

create policy "users_select_session_completions"
  on session_completions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "users_insert_session_completions"
  on session_completions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users_update_session_completions"
  on session_completions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_delete_session_completions"
  on session_completions for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "users_select_student_progress_entries"
  on student_progress_entries for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from students st
      where st.id = student_progress_entries.student_id
        and st.student_user_id = auth.uid()
    )
  );

create policy "users_insert_student_progress_entries"
  on student_progress_entries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users_update_student_progress_entries"
  on student_progress_entries for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users_delete_student_progress_entries"
  on student_progress_entries for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function save_student_workout_atomic(
  input_student_id text,
  input_exercises jsonb
)
returns table(saved_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  exercises_count integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if input_student_id is null or length(trim(input_student_id)) = 0 then
    raise exception 'invalid_student_id';
  end if;

  if input_exercises is null or jsonb_typeof(input_exercises) <> 'array' then
    raise exception 'invalid_exercises_payload';
  end if;

  select st.user_id
  into owner_id
  from students st
  where st.id = input_student_id;

  if owner_id is null then
    raise exception 'student_not_found';
  end if;

  if owner_id <> auth.uid() then
    raise exception 'forbidden_student';
  end if;

  exercises_count := jsonb_array_length(input_exercises);
  if exercises_count > 250 then
    raise exception 'too_many_exercises';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(input_exercises) as e(elem)
    where nullif(trim(coalesce(e.elem ->> 'name', '')), '') is null
      or nullif(trim(coalesce(e.elem ->> 'sets', '')), '') is null
  ) then
    raise exception 'invalid_exercise_fields';
  end if;

  delete from exercises
  where student_id = input_student_id
    and user_id = auth.uid();

  insert into exercises (
    id, user_id, student_id, name, sets, day, routine, note
  )
  select
    format('%s-e%s', input_student_id, parsed.idx),
    auth.uid(),
    input_student_id,
    parsed.name,
    parsed.sets,
    parsed.day,
    parsed.routine,
    parsed.note
  from (
    select
      row_number() over () as idx,
      trim(elem ->> 'name') as name,
      trim(elem ->> 'sets') as sets,
      nullif(trim(coalesce(elem ->> 'day', '')), '') as day,
      nullif(trim(coalesce(elem ->> 'routine', '')), '') as routine,
      trim(coalesce(elem ->> 'note', '')) as note
    from jsonb_array_elements(input_exercises) as e(elem)
  ) as parsed;

  return query select exercises_count;
end;
$$;

create or replace function sync_student_progress_atomic(
  input_student_id text,
  input_session_id text,
  input_adherence_delta integer,
  input_streak_delta integer,
  input_is_completing boolean
)
returns table(next_adherence integer, next_streak integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_adherence integer;
  current_streak integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if input_student_id is null or length(trim(input_student_id)) = 0 then
    raise exception 'invalid_student_id';
  end if;

  if input_session_id is null or length(trim(input_session_id)) = 0 then
    raise exception 'invalid_session_id';
  end if;

  if input_adherence_delta is null or input_adherence_delta < -100 or input_adherence_delta > 100 then
    raise exception 'invalid_adherence_delta';
  end if;

  if input_streak_delta is null or input_streak_delta < -30 or input_streak_delta > 30 then
    raise exception 'invalid_streak_delta';
  end if;

  if not exists (
    select 1
    from students st
    where st.id = input_student_id
      and st.user_id = auth.uid()
  ) then
    raise exception 'forbidden_student';
  end if;

  if not exists (
    select 1
    from sessions se
    where se.id = input_session_id
      and se.user_id = auth.uid()
      and se.student_id = input_student_id
  ) then
    raise exception 'forbidden_session';
  end if;

  insert into session_completions (
    user_id, session_id, completed, updated_at
  )
  values (
    auth.uid(), input_session_id, input_is_completing, now()
  )
  on conflict (user_id, session_id)
  do update set
    completed = excluded.completed,
    updated_at = now();

  update students st
  set
    adherence = greatest(0, least(100, st.adherence + input_adherence_delta)),
    streak = greatest(0, st.streak + input_streak_delta)
  where st.id = input_student_id
    and st.user_id = auth.uid()
  returning st.adherence, st.streak
  into current_adherence, current_streak;

  insert into student_progress_entries (
    user_id, student_id, session_id, score, delta, source, is_completing
  )
  values (
    auth.uid(),
    input_student_id,
    input_session_id,
    current_adherence,
    input_adherence_delta,
    'session_toggle',
    input_is_completing
  );

  return query select current_adherence, current_streak;
end;
$$;

revoke all on function save_student_workout_atomic(text, jsonb) from public;
grant execute on function save_student_workout_atomic(text, jsonb) to authenticated;
revoke all on function sync_student_progress_atomic(text, text, integer, integer, boolean) from public;
grant execute on function sync_student_progress_atomic(text, text, integer, integer, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- RBAC + Finance
-- ---------------------------------------------------------------------------

create table if not exists app_roles (
  role text primary key check (role in ('trainer', 'student', 'admin')),
  description text not null default '',
  created_at timestamptz not null default now()
);

insert into app_roles (role, description)
values
  ('trainer', 'Pode gerenciar alunos, treinos e financeiro'),
  ('student', 'Pode acessar apenas o proprio portal de aluno'),
  ('admin', 'Pode auditar e administrar todo o workspace')
on conflict (role) do update set description = excluded.description;

create table if not exists user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null references app_roles(role) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create index if not exists user_roles_role_idx on user_roles(role);

alter table user_roles enable row level security;

drop policy if exists "users_select_own_roles_or_admin" on user_roles;
drop policy if exists "admins_manage_user_roles" on user_roles;

create policy "users_select_own_roles_or_admin"
  on user_roles for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

create policy "admins_manage_user_roles"
  on user_roles for all
  to authenticated
  using (
    exists (
      select 1
      from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from user_roles ur
      where ur.user_id = auth.uid()
        and ur.role = 'admin'
    )
  );

create or replace function has_role(check_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = check_role
  );
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select has_role('admin');
$$;

create or replace function is_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select has_role('trainer') or has_role('admin');
$$;

revoke all on function has_role(text) from public;
grant execute on function has_role(text) to authenticated;
revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;
revoke all on function is_trainer() from public;
grant execute on function is_trainer() to authenticated;

create or replace function assign_default_trainer_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into user_roles (user_id, role, assigned_by)
  values (new.id, 'trainer', new.id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_trainer_role on auth.users;
create trigger on_auth_user_created_assign_trainer_role
  after insert on auth.users
  for each row
  execute function assign_default_trainer_role();

alter table trainer_profiles add column if not exists pix_key text;

create table if not exists student_payments (
  id text primary key default substr(md5(random()::text || clock_timestamp()::text), 1, 24),
  user_id uuid not null references auth.users(id) on delete cascade,
  student_id text not null references students(id) on delete cascade,
  month_ref text not null check (month_ref ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  monthly_fee numeric(10,2) not null default 0 check (monthly_fee >= 0),
  due_day integer not null default 10 check (due_day between 1 and 31),
  payment_method text not null default 'pix' check (payment_method in ('pix')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  last_paid_at timestamptz,
  pix_key_snapshot text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, student_id, month_ref)
);

create index if not exists student_payments_user_id_idx on student_payments(user_id);
create index if not exists student_payments_student_id_idx on student_payments(student_id);
create index if not exists student_payments_month_ref_idx on student_payments(month_ref);

alter table student_payments enable row level security;

drop policy if exists "users_select_student_payments" on student_payments;
drop policy if exists "users_insert_student_payments" on student_payments;
drop policy if exists "users_update_student_payments" on student_payments;
drop policy if exists "users_delete_student_payments" on student_payments;

create policy "users_select_student_payments"
  on student_payments for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from students st
      where st.id = student_payments.student_id
        and st.student_user_id = auth.uid()
    )
    or is_admin()
  );

create policy "users_insert_student_payments"
  on student_payments for insert
  to authenticated
  with check (
    (auth.uid() = user_id and is_trainer())
    or is_admin()
  );

create policy "users_update_student_payments"
  on student_payments for update
  to authenticated
  using (
    (auth.uid() = user_id and is_trainer())
    or is_admin()
  )
  with check (
    (auth.uid() = user_id and is_trainer())
    or is_admin()
  );

create policy "users_delete_student_payments"
  on student_payments for delete
  to authenticated
  using (
    (auth.uid() = user_id and is_trainer())
    or is_admin()
  );

create or replace function enforce_student_payment_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from students st
    where st.id = new.student_id
      and st.user_id = new.user_id
  ) then
    raise exception 'invalid_student_owner';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists student_payments_enforce_owner on student_payments;
create trigger student_payments_enforce_owner
  before insert or update on student_payments
  for each row
  execute function enforce_student_payment_owner();

create or replace function upsert_student_payment(
  input_student_id text,
  input_month_ref text,
  input_monthly_fee numeric,
  input_due_day integer,
  input_pix_key text,
  input_mark_paid boolean,
  input_note text default null
)
returns table (
  payment_id text,
  status text,
  last_paid_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  normalized_month_ref text;
  normalized_due_day integer;
  normalized_fee numeric(10,2);
  next_status text;
  next_paid_at timestamptz;
  upserted_id text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select st.user_id into owner_id
  from students st
  where st.id = input_student_id
  limit 1;

  if owner_id is null then
    raise exception 'student_not_found';
  end if;

  if owner_id <> auth.uid() and not is_admin() then
    raise exception 'forbidden_student';
  end if;

  normalized_month_ref := trim(coalesce(input_month_ref, ''));
  if normalized_month_ref !~ '^\d{4}-(0[1-9]|1[0-2])$' then
    raise exception 'invalid_month_ref';
  end if;

  normalized_due_day := greatest(1, least(31, coalesce(input_due_day, 10)));
  normalized_fee := greatest(0, coalesce(input_monthly_fee, 0));

  if coalesce(input_mark_paid, false) then
    next_status := 'paid';
    next_paid_at := now();
  else
    next_status := case when extract(day from now())::integer > normalized_due_day then 'overdue' else 'pending' end;
    next_paid_at := null;
  end if;

  insert into student_payments (
    user_id, student_id, month_ref, monthly_fee, due_day, payment_method, status, last_paid_at, pix_key_snapshot, note
  )
  values (
    owner_id,
    input_student_id,
    normalized_month_ref,
    normalized_fee,
    normalized_due_day,
    'pix',
    next_status,
    next_paid_at,
    nullif(trim(coalesce(input_pix_key, '')), ''),
    nullif(trim(coalesce(input_note, '')), '')
  )
  on conflict (user_id, student_id, month_ref)
  do update set
    monthly_fee = excluded.monthly_fee,
    due_day = excluded.due_day,
    payment_method = 'pix',
    status = excluded.status,
    last_paid_at = excluded.last_paid_at,
    pix_key_snapshot = excluded.pix_key_snapshot,
    note = excluded.note,
    updated_at = now()
  returning id, student_payments.status, student_payments.last_paid_at
  into upserted_id, next_status, next_paid_at;

  if owner_id = auth.uid() and input_pix_key is not null then
    insert into trainer_profiles (user_id, pix_key)
    values (owner_id, nullif(trim(input_pix_key), ''))
    on conflict (user_id)
    do update set
      pix_key = excluded.pix_key,
      updated_at = now();
  end if;

  return query select upserted_id, next_status, next_paid_at;
end;
$$;

create or replace function get_student_portal_finance()
returns table (
  student_id text,
  monthly_fee numeric,
  due_day integer,
  month_ref text,
  payment_status text,
  last_paid_at timestamptz,
  pix_key text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_student students%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into target_student
  from students st
  where st.student_user_id = auth.uid()
  limit 1;

  if not found then
    return;
  end if;

  return query
  with latest_payment as (
    select sp.*
    from student_payments sp
    where sp.user_id = target_student.user_id
      and sp.student_id = target_student.id
    order by sp.month_ref desc
    limit 1
  )
  select
    target_student.id,
    coalesce(lp.monthly_fee, 0)::numeric,
    coalesce(lp.due_day, 10)::integer,
    coalesce(lp.month_ref, to_char(now(), 'YYYY-MM'))::text,
    coalesce(lp.status, case when extract(day from now())::integer > 10 then 'overdue' else 'pending' end)::text,
    lp.last_paid_at,
    coalesce(tp.pix_key, '')::text
  from latest_payment lp
  full join trainer_profiles tp on tp.user_id = target_student.user_id
  limit 1;
end;
$$;

revoke all on function upsert_student_payment(text, text, numeric, integer, text, boolean, text) from public;
grant execute on function upsert_student_payment(text, text, numeric, integer, text, boolean, text) to authenticated;
revoke all on function get_student_portal_finance() from public;
grant execute on function get_student_portal_finance() to authenticated;

-- Harden existing core policies with role checks and admin override.
drop policy if exists "users_select_students" on students;
drop policy if exists "users_insert_students" on students;
drop policy if exists "users_update_students" on students;
drop policy if exists "users_delete_students" on students;

create policy "users_select_students"
  on students for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = student_user_id or is_admin());

create policy "users_insert_students"
  on students for insert
  to authenticated
  with check ((auth.uid() = user_id and is_trainer()) or is_admin());

create policy "users_update_students"
  on students for update
  to authenticated
  using ((auth.uid() = user_id and is_trainer()) or is_admin())
  with check ((auth.uid() = user_id and is_trainer()) or is_admin());

create policy "users_delete_students"
  on students for delete
  to authenticated
  using ((auth.uid() = user_id and is_trainer()) or is_admin());

drop policy if exists "users_select_sessions" on sessions;
drop policy if exists "users_insert_sessions" on sessions;
drop policy if exists "users_update_sessions" on sessions;
drop policy if exists "users_delete_sessions" on sessions;

create policy "users_select_sessions"
  on sessions for select
  to authenticated
  using (
    is_admin()
    or (
      auth.uid() = user_id
      and exists (
        select 1 from students st
        where st.id = sessions.student_id and st.user_id = auth.uid()
      )
    )
    or exists (
      select 1 from students st
      where st.id = sessions.student_id and st.student_user_id = auth.uid()
    )
  );

create policy "users_insert_sessions"
  on sessions for insert
  to authenticated
  with check (
    (
      auth.uid() = user_id
      and is_trainer()
      and exists (
        select 1 from students st
        where st.id = sessions.student_id and st.user_id = auth.uid()
      )
    )
    or is_admin()
  );

create policy "users_update_sessions"
  on sessions for update
  to authenticated
  using (
    (
      auth.uid() = user_id
      and is_trainer()
      and exists (
        select 1 from students st
        where st.id = sessions.student_id and st.user_id = auth.uid()
      )
    )
    or is_admin()
  )
  with check (
    (
      auth.uid() = user_id
      and is_trainer()
      and exists (
        select 1 from students st
        where st.id = sessions.student_id and st.user_id = auth.uid()
      )
    )
    or is_admin()
  );

create policy "users_delete_sessions"
  on sessions for delete
  to authenticated
  using ((auth.uid() = user_id and is_trainer()) or is_admin());

drop policy if exists "users_select_exercises" on exercises;
drop policy if exists "users_insert_exercises" on exercises;
drop policy if exists "users_update_exercises" on exercises;
drop policy if exists "users_delete_exercises" on exercises;

create policy "users_select_exercises"
  on exercises for select
  to authenticated
  using (
    is_admin()
    or (
      auth.uid() = user_id
      and exists (
        select 1 from students st
        where st.id = exercises.student_id and st.user_id = auth.uid()
      )
    )
    or exists (
      select 1 from students st
      where st.id = exercises.student_id and st.student_user_id = auth.uid()
    )
  );

create policy "users_insert_exercises"
  on exercises for insert
  to authenticated
  with check (
    (
      auth.uid() = user_id
      and is_trainer()
      and exists (
        select 1 from students st
        where st.id = exercises.student_id and st.user_id = auth.uid()
      )
    )
    or is_admin()
  );

create policy "users_update_exercises"
  on exercises for update
  to authenticated
  using (
    (
      auth.uid() = user_id
      and is_trainer()
      and exists (
        select 1 from students st
        where st.id = exercises.student_id and st.user_id = auth.uid()
      )
    )
    or is_admin()
  )
  with check (
    (
      auth.uid() = user_id
      and is_trainer()
      and exists (
        select 1 from students st
        where st.id = exercises.student_id and st.user_id = auth.uid()
      )
    )
    or is_admin()
  );

create policy "users_delete_exercises"
  on exercises for delete
  to authenticated
  using ((auth.uid() = user_id and is_trainer()) or is_admin());

drop policy if exists "users_select_trainer_profiles" on trainer_profiles;
drop policy if exists "users_insert_trainer_profiles" on trainer_profiles;
drop policy if exists "users_update_trainer_profiles" on trainer_profiles;
drop policy if exists "users_delete_trainer_profiles" on trainer_profiles;

create policy "users_select_trainer_profiles"
  on trainer_profiles for select
  to authenticated
  using (auth.uid() = user_id or is_admin());

create policy "users_insert_trainer_profiles"
  on trainer_profiles for insert
  to authenticated
  with check ((auth.uid() = user_id and is_trainer()) or is_admin());

create policy "users_update_trainer_profiles"
  on trainer_profiles for update
  to authenticated
  using ((auth.uid() = user_id and is_trainer()) or is_admin())
  with check ((auth.uid() = user_id and is_trainer()) or is_admin());

create policy "users_delete_trainer_profiles"
  on trainer_profiles for delete
  to authenticated
  using (is_admin());

-- Recreate claim function after RBAC tables exist so student role can be granted automatically.
create or replace function claim_student_access(input_code text)
returns table (student_id text, student_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_student students%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select *
  into target_student
  from students
  where share_code = upper(trim(input_code))
    and student_user_id is null
  limit 1;

  if not found then
    return;
  end if;

  update students
  set student_user_id = auth.uid()
  where id = target_student.id
    and student_user_id is null;

  insert into user_roles (user_id, role, assigned_by)
  values (auth.uid(), 'student', target_student.user_id)
  on conflict do nothing;

  return query
  select target_student.id, target_student.name;
end;
$$;

revoke all on function claim_student_access(text) from public;
grant execute on function claim_student_access(text) to authenticated;
