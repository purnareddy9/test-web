create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null default 'DevOps Engineer',
  headline text not null default 'Senior DevOps & Cloud Engineer',
  bio text,
  location text,
  email text,
  phone text,
  github_url text,
  linkedin_url text,
  website text,
  avatar_url text,
  availability text default 'Open to opportunities',
  years_experience integer default 0,
  projects_count integer default 0,
  deployments_count integer default 0,
  certifications_count integer default 0,
  uptime_target text default '99.9%',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_public_read"
on profiles for select
using (true);

create policy "profiles_auth_write"
on profiles for all
using (auth.role() = 'authenticated');


-- PROJECTS
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  short_description text,
  long_description text,
  image_url text,
  architecture_image text,
  technologies text[] default '{}',
  github_url text,
  live_url text,
  featured boolean default false,
  display_order integer default 0,
  problem text,
  solution text,
  architecture text,
  infrastructure text,
  cicd text,
  monitoring text,
  security text,
  results text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table projects enable row level security;

create policy "projects_public_read"
on projects for select
using (true);

create policy "projects_auth_write"
on projects for all
using (auth.role() = 'authenticated');


-- SKILLS
create table if not exists skills (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  proficiency integer default 80 check (proficiency between 0 and 100),
  level text default 'advanced',
  years_experience integer,
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table skills enable row level security;

create policy "skills_public_read"
on skills for select
using (true);

create policy "skills_auth_write"
on skills for all
using (auth.role() = 'authenticated');


-- EXPERIENCE
create table if not exists experience (
  id uuid primary key default uuid_generate_v4(),
  company text not null,
  role text not null,
  location text,
  start_date date not null,
  end_date date,
  current boolean default false,
  description text,
  achievements text[] default '{}',
  technologies text[] default '{}',
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table experience enable row level security;

create policy "experience_public_read"
on experience for select
using (true);

create policy "experience_auth_write"
on experience for all
using (auth.role() = 'authenticated');


-- EDUCATION
create table if not exists education (
  id uuid primary key default uuid_generate_v4(),
  institution text not null,
  degree text not null,
  field text,
  start_date date,
  end_date date,
  current boolean default false,
  description text,
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table education enable row level security;

create policy "education_public_read"
on education for select
using (true);

create policy "education_auth_write"
on education for all
using (auth.role() = 'authenticated');


-- CERTIFICATIONS
create table if not exists certifications (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  issuer text not null,
  credential_id text,
  issue_date date,
  expiry_date date,
  credential_url text,
  certificate_image text,
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table certifications enable row level security;

create policy "certifications_public_read"
on certifications for select
using (true);

create policy "certifications_auth_write"
on certifications for all
using (auth.role() = 'authenticated');


-- TESTIMONIALS
create table if not exists testimonials (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text,
  company text,
  avatar_url text,
  content text not null,
  rating integer default 5 check (rating between 1 and 5),
  featured boolean default false,
  display_order integer default 0,
  created_at timestamptz default now()
);

alter table testimonials enable row level security;

create policy "testimonials_public_read"
on testimonials for select
using (featured = true);

create policy "testimonials_auth_write"
on testimonials for all
using (auth.role() = 'authenticated');


-- MESSAGES
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  status text default 'new',
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "messages_public_insert"
on messages for insert
with check (true);

create policy "messages_auth_read"
on messages for select
using (auth.role() = 'authenticated');

create policy "messages_auth_update"
on messages for update
using (auth.role() = 'authenticated');

create policy "messages_auth_delete"
on messages for delete
using (auth.role() = 'authenticated');


-- RESUME
create table if not exists resume (
  id uuid primary key default uuid_generate_v4(),
  file_url text not null,
  file_name text not null,
  active boolean default true,
  created_at timestamptz default now()
);

alter table resume enable row level security;

create policy "resume_public_read"
on resume for select
using (active = true);

create policy "resume_auth_write"
on resume for all
using (auth.role() = 'authenticated');


-- STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "portfolio_public_read"
on storage.objects for select
using (bucket_id = 'portfolio');

create policy "portfolio_auth_write"
on storage.objects for all
using (
  auth.role() = 'authenticated'
  and bucket_id = 'portfolio'
);


-- UPDATED AT FUNCTION
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- UPDATED AT TRIGGERS
drop trigger if exists profiles_updated_at on profiles;

create trigger profiles_updated_at
before update on profiles
for each row
execute function update_updated_at();


drop trigger if exists projects_updated_at on projects;

create trigger projects_updated_at
before update on projects
for each row
execute function update_updated_at();


-- SITE SETTINGS & ANALYTICS
create table if not exists site_settings (
  id text primary key default 'default',
  sections jsonb not null default '[]'::jsonb,
  session_timeout integer not null default 30,
  email_notifications_enabled boolean default true,
  admin_notification_email text default '',
  views_count integer default 142,
  last_revoked_at timestamptz default null,
  active_session_id text default null,
  updated_at timestamptz default now()
);

alter table site_settings add column if not exists sections jsonb not null default '[]'::jsonb;
alter table site_settings add column if not exists session_timeout integer not null default 30;
alter table site_settings add column if not exists email_notifications_enabled boolean default true;
alter table site_settings add column if not exists admin_notification_email text default '';
alter table site_settings add column if not exists views_count integer default 142;
alter table site_settings add column if not exists last_revoked_at timestamptz default null;
alter table site_settings add column if not exists active_session_id text default null;
alter table site_settings add column if not exists updated_at timestamptz default now();

alter table site_settings enable row level security;

drop policy if exists "site_settings_public_read" on site_settings;
drop policy if exists "site_settings_auth_write" on site_settings;

create policy "site_settings_public_read" on site_settings for select using (true);
create policy "site_settings_auth_write" on site_settings for all using (auth.role() = 'authenticated');

