-- Migration: 002_site_settings.sql
-- Table to persist site settings, portfolio section order & visibility, and session revocation policy

create table if not exists site_settings (
  id text primary key default 'default',
  sections jsonb not null default '[]'::jsonb,
  session_timeout integer not null default 30,
  last_revoked_at timestamptz default null,
  active_session_id text default null,
  updated_at timestamptz default now()
);

-- Ensure columns exist if table was already created
alter table site_settings add column if not exists last_revoked_at timestamptz default null;
alter table site_settings add column if not exists active_session_id text default null;

-- Enable Row Level Security (RLS)
alter table site_settings enable row level security;

-- Policies (recreate safely):
drop policy if exists "site_settings_public_read" on site_settings;
drop policy if exists "site_settings_auth_write" on site_settings;

-- 1. Anyone (public visitors) can read site settings
create policy "site_settings_public_read" on site_settings
  for select using (true);

-- 2. Authenticated admins can update or insert site settings
create policy "site_settings_auth_write" on site_settings
  for all using (auth.role() = 'authenticated');
