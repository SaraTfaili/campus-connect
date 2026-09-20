create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  usc_email text not null unique check (lower(usc_email) like '%@usc.edu'),
  full_name text,
  major text,
  graduation_year integer check (graduation_year between 2026 and 2040),
  linkedin_url text,
  show_usc_email boolean not null default true,
  show_phone boolean not null default false,
  show_academic_details boolean not null default true,
  show_linkedin boolean not null default true,
  notify_membership_requests boolean not null default true,
  notify_updates_events boolean not null default true,
  notify_messages boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can create their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
