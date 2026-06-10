-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. USER ROLES DEFINITION
create type user_role as enum ('ADMIN', 'CLIENT');

-- 2. PROJECTS TABLE
-- Stores metadata and securely references external third-party API integration keys
create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  domain text not null unique,
  vercel_project_id text,
  sanity_project_id text,
  sanity_dataset text default 'production',
  supabase_project_ref text,
  encrypted_vercel_token text,       -- Scoped access token for Vercel API
  encrypted_sanity_token text,       -- Management token for Sanity API
  encrypted_supabase_anon_key text,  -- Anon key for client Supabase DB
  encrypted_resend_api_key text,     -- API key for Resend email delivery
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration query for existing databases:
-- ALTER TABLE projects 
--   ADD COLUMN supabase_project_ref text,
--   ADD COLUMN encrypted_supabase_anon_key text,
--   ADD COLUMN encrypted_resend_api_key text;

-- 3. USER PROFILES TABLE
-- Extends the core Supabase authentication system to manage access levels
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role user_role default 'CLIENT'::user_role not null,
  -- For CLIENT role, this explicitly binds them to exactly ONE project. 
  -- For ADMIN role, this remains NULL to grant global visibility.
  project_id uuid references projects(id) on delete set null,
  server_stats_access boolean default false,
  updated_at timestamp with time zone
);

-- Migration query for existing databases:
-- ALTER TABLE profiles ADD COLUMN email text;
-- ALTER TABLE profiles ADD COLUMN server_stats_access boolean default false;
-- UPDATE profiles SET server_stats_access = true WHERE role = 'ADMIN';

-- 4. ANALYTICS EVENTS TABLE
-- Houses high-performance raw logs streamed directly from client sites
create table analytics_events (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  path text not null,
  referrer text,
  browser text,
  os text,
  country text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PERFORMANCE OPTIMIZATION INDEX
-- Speeds up date-range filtering and project-specific rendering inside analytics views
create index idx_analytics_project_time on analytics_events(project_id, timestamp desc);

-- 5. RASPBERRY PI SERVER STATISTICS TABLE
-- Houses hardware telemetry logs reported from home servers
create table raspberrypi_stats (
  id uuid default uuid_generate_v4() primary key,
  cpu_usage numeric not null,
  memory_usage numeric not null,
  disk_usage numeric not null,
  temperature numeric not null,
  uptime text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index to fast filter logs by time (useful for charts)
create index idx_pi_stats_time on raspberrypi_stats(created_at desc);

-- Migration query for existing databases:
-- create table raspberrypi_stats (
--   id uuid default uuid_generate_v4() primary key,
--   cpu_usage numeric not null,
--   memory_usage numeric not null,
--   disk_usage numeric not null,
--   temperature numeric not null,
--   uptime text not null,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );
-- create index idx_pi_stats_time on raspberrypi_stats(created_at desc);
