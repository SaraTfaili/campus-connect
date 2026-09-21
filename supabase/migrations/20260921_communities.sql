create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'Student organization',
  is_official boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'board_admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  unique (community_id, user_id)
);

create or replace function public.is_board_admin(target_community_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.community_members
    where community_id = target_community_id
      and user_id = auth.uid()
      and role = 'board_admin'
      and status = 'approved'
  );
$$;

alter table public.communities enable row level security;
alter table public.community_members enable row level security;

create policy "Authenticated users can view official communities"
on public.communities for select to authenticated using (is_official = true);

create policy "Members can view their own requests"
on public.community_members for select to authenticated
using (user_id = auth.uid() or public.is_board_admin(community_id));

create policy "Users can request to join a community"
on public.community_members for insert to authenticated
with check (user_id = auth.uid() and role = 'member' and status = 'pending');

create policy "Board admins can review requests"
on public.community_members for update to authenticated
using (public.is_board_admin(community_id))
with check (public.is_board_admin(community_id));

insert into public.communities (name, slug, description, category)
values
  ('MENA at USC', 'mena-at-usc', 'A home for USC students connected to Middle Eastern and North African cultures.', 'Cultural community'),
  ('Women in Computing', 'women-in-computing', 'A supportive USC community for women and allies building in technology.', 'Academic & career')
on conflict (slug) do nothing;