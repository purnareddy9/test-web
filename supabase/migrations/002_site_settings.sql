-- Migration: 002_site_settings.sql
-- Table to persist site settings, portfolio section order & visibility, and session timeout policy

create table if not exists site_settings (
  id text primary key default 'default',
  sections jsonb not null default '[]'::jsonb,
  session_timeout integer not null default 30,
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table site_settings enable row level security;

-- Policies:
-- 1. Anyone (public visitors) can read site settings to display the configured portfolio sections
create policy "site_settings_public_read" on site_settings
  for select using (true);

-- 2. Only authenticated admins can update or insert site settings
create policy "site_settings_auth_write" on site_settings
  for all using (auth.role() = 'authenticated');
