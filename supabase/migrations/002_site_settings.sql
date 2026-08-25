-- Migration: 002_site_settings.sql
-- Table to persist site settings, portfolio section order & visibility, session timeout, notifications, profile view analytics, and messages RLS update

-- ── 1. SITE SETTINGS & ANALYTICS ────────────────────────────
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

-- Ensure all columns exist safely (idempotent for existing deployments)
alter table site_settings add column if not exists sections jsonb not null default '[]'::jsonb;
alter table site_settings add column if not exists session_timeout integer not null default 30;
alter table site_settings add column if not exists email_notifications_enabled boolean default true;
alter table site_settings add column if not exists admin_notification_email text default '';
alter table site_settings add column if not exists views_count integer default 142;
alter table site_settings add column if not exists last_revoked_at timestamptz default null;
alter table site_settings add column if not exists active_session_id text default null;
alter table site_settings add column if not exists updated_at timestamptz default now();

-- Enable Row Level Security (RLS)
alter table site_settings enable row level security;

-- Policies (recreate safely):
drop policy if exists "site_settings_public_read" on site_settings;
drop policy if exists "site_settings_auth_write" on site_settings;
drop policy if exists "site_settings_public_update_views" on site_settings;

-- Anyone (public visitors) can read site settings
create policy "site_settings_public_read" on site_settings
  for select using (true);

-- Authenticated admins can update or insert site settings
create policy "site_settings_auth_write" on site_settings
  for all using (auth.role() = 'authenticated');


-- ── 2. MESSAGES TABLE RLS POLICIES (Allow public contact submissions) ────
alter table messages enable row level security;

drop policy if exists "messages_public_insert" on messages;
drop policy if exists "messages_auth_read" on messages;
drop policy if exists "messages_auth_update" on messages;
drop policy if exists "messages_auth_delete" on messages;

-- Allow public visitors (anon) & authenticated users to insert contact messages
create policy "messages_public_insert"
on messages for insert
to anon, authenticated
with check (true);

-- Allow authenticated admin to view, update status, and delete messages
create policy "messages_auth_read"
on messages for select
to authenticated
using (true);

create policy "messages_auth_update"
on messages for update
to authenticated
using (true);

create policy "messages_auth_delete"
on messages for delete
to authenticated
using (true);


-- ── 3. REALTIME PUBLICATION (Optional) ───────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end $$;
