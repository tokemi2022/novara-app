-- ===== NOVARA PLATFORM DATABASE SCHEMA =====
-- Run this entire file in Supabase SQL Editor

-- Families (one per household)
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  pin_hash text not null,
  created_at timestamptz default now()
);

-- Children (one family can have multiple children)
create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  name text not null,
  date_of_birth date not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- Child languages (multiple per child)
create table if not exists child_languages (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  language text not null,
  context text not null check (context in ('home','school','community'))
);

-- Child location
create table if not exists child_locations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  city text,
  country text,
  country_code text,
  latitude numeric,
  longitude numeric
);

-- Parents (named members of a family)
create table if not exists parents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  display_name text not null,
  role text default 'parent'
);

-- Weekly plans (AI generated, stored per child per week)
create table if not exists weekly_plans (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  week_number int not null,
  age_months int not null,
  activities jsonb not null,
  generated_at timestamptz default now(),
  unique(child_id, week_number)
);

-- Milestones
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  title text not null,
  domain text not null,
  parent_name text,
  notes text,
  logged_at timestamptz default now()
);

-- Moments (photos + notes)
create table if not exists moments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  caption text not null,
  note text,
  photo_url text,
  parent_name text,
  logged_at timestamptz default now()
);

-- Domain progress (per child)
create table if not exists domain_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  domain text not null,
  pct int default 0,
  last_activity text,
  updated_at timestamptz default now(),
  unique(child_id, domain)
);

-- Week history (archived weeks)
create table if not exists week_history (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade,
  week_number int not null,
  done int default 0,
  total int default 5,
  archived_at timestamptz default now()
);

-- App stats per child
create table if not exists child_stats (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references children(id) on delete cascade unique,
  words_signs int default 0,
  streak int default 0,
  total_milestones int default 0,
  start_date date default current_date,
  updated_at timestamptz default now()
);

-- ===== ROW LEVEL SECURITY =====
alter table families enable row level security;
alter table children enable row level security;
alter table child_languages enable row level security;
alter table child_locations enable row level security;
alter table parents enable row level security;
alter table weekly_plans enable row level security;
alter table milestones enable row level security;
alter table moments enable row level security;
alter table domain_progress enable row level security;
alter table week_history enable row level security;
alter table child_stats enable row level security;

-- Allow anon to insert families (registration)
create policy "anon can register" on families for insert to anon with check (true);
create policy "anon can read own family" on families for select to anon using (true);
create policy "anon can update family" on families for update to anon using (true);

-- Allow anon full access to all child-related tables (PIN protects the app)
create policy "anon access children" on children for all to anon using (true) with check (true);
create policy "anon access languages" on child_languages for all to anon using (true) with check (true);
create policy "anon access locations" on child_locations for all to anon using (true) with check (true);
create policy "anon access parents" on parents for all to anon using (true) with check (true);
create policy "anon access plans" on weekly_plans for all to anon using (true) with check (true);
create policy "anon access milestones" on milestones for all to anon using (true) with check (true);
create policy "anon access moments" on moments for all to anon using (true) with check (true);
create policy "anon access domain_progress" on domain_progress for all to anon using (true) with check (true);
create policy "anon access week_history" on week_history for all to anon using (true) with check (true);
create policy "anon access child_stats" on child_stats for all to anon using (true) with check (true);
