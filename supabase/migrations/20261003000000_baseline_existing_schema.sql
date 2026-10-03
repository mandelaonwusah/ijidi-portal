-- Baseline snapshot of the public schema in igx-os-production, read on 2026-10-03.
--
-- This file RECORDS what is already in the database. It makes no new changes:
-- every statement is guarded (IF NOT EXISTS, CREATE OR REPLACE with the exact
-- current body, or a DO block that skips existing objects), so running it
-- against the live database is a no-op.
--
-- Why it exists:
--   * 20260919000001, ...002, ...004 and ...005 were applied by hand; their
--     effects are in the database but the database migration history only
--     records 20260921183530_create_igx_chat_history.
--   * 20260919000003 was never committed to git. Its contents are unknown and
--     are NOT reconstructed here; this file only records the end state.
--
-- Policies are recorded exactly as they are now, including the three that
-- still compare auth.uid() to one fixed account ID (activity_log read,
-- decisions read, proposals full access).

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'access_tier' and typnamespace = 'public'::regnamespace) then
    create type public.access_tier as enum ('SOVEREIGN', 'CLIENT', 'DEMO', 'MEMBER');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid not null,
  full_name text not null,
  display_name text not null,
  handle text not null,
  email text not null,
  whatsapp_number text,
  organisation_name text,
  organisation_type text,
  country text default 'Nigeria'::text,
  city text,
  timezone text default 'Africa/Lagos'::text,
  profile_photo_url text,
  bio_en text,
  bio_fr text,
  bio_ar text,
  access_tier public.access_tier not null default 'MEMBER'::public.access_tier,
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_handle_key unique (handle),
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade
);

create table if not exists public.proposals (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  actor_type text not null default 'IGX_AI'::text,
  source text,
  intent text not null,
  suggested_action text not null,
  reasoning text,
  confidence_score numeric(3,2),
  status text not null default 'pending_review'::text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_note text,
  constraint proposals_pkey primary key (id),
  constraint proposals_reviewed_by_fkey foreign key (reviewed_by) references public.profiles(id),
  constraint proposals_status_check check (status = any (array['pending_review'::text, 'approved'::text, 'rejected'::text]))
);

create table if not exists public.activity_log (
  id bigint generated always as identity,
  "timestamp" timestamp without time zone not null default now(),
  actor text not null,
  action text not null,
  entity_id text,
  details jsonb,
  constraint activity_log_pkey primary key (id)
);

create table if not exists public.decisions (
  id bigint generated always as identity,
  date text not null,
  label text not null,
  detail text not null,
  state text not null default 'open'::text,
  created_at timestamp without time zone default now(),
  constraint decisions_pkey primary key (id),
  constraint decisions_state_check check (state = any (array['frozen'::text, 'open'::text]))
);

create table if not exists public.entity_status (
  id bigint generated always as identity,
  entity_name text not null,
  current_state text not null default 'open'::text,
  last_updated timestamp without time zone default now(),
  website_url text,
  logo_url text,
  constraint entity_status_pkey primary key (id),
  constraint entity_status_entity_name_key unique (entity_name),
  constraint entity_status_entity_name_check check (entity_name = any (array['Group'::text, 'Foundation'::text, 'Atelier'::text, 'Media'::text, 'Personal'::text])),
  constraint entity_status_current_state_check check (current_state = any (array['live'::text, 'building'::text, 'open'::text, 'standby'::text, 'forming'::text]))
);

create table if not exists public.log (
  id uuid not null default gen_random_uuid(),
  actor text default 'SYSTEM'::text,
  action text not null,
  type text default 'SYSTEM'::text,
  created_at timestamp with time zone default now(),
  constraint log_pkey primary key (id)
);

create table if not exists public.igx_conversations (
  id uuid not null default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint igx_conversations_pkey primary key (id),
  constraint igx_conversations_owner_id_fkey foreign key (owner_id) references public.profiles(id) on delete cascade
);

create table if not exists public.igx_messages (
  id uuid not null default gen_random_uuid(),
  conversation_id uuid not null,
  scope_label text not null default 'General'::text,
  text text not null,
  proposal_id uuid,
  created_at timestamp with time zone not null default now(),
  constraint igx_messages_pkey primary key (id),
  constraint igx_messages_conversation_id_fkey foreign key (conversation_id) references public.igx_conversations(id) on delete cascade,
  constraint igx_messages_proposal_id_fkey foreign key (proposal_id) references public.proposals(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Indexes (beyond primary keys and unique constraints)
-- ---------------------------------------------------------------------------
create index if not exists idx_proposals_status on public.proposals using btree (status);
create index if not exists idx_log_created_at on public.log using btree (created_at desc);
create index if not exists igx_conversations_owner_updated_idx on public.igx_conversations using btree (owner_id, updated_at desc);
create index if not exists igx_messages_conversation_created_idx on public.igx_messages using btree (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Functions (bodies exactly as in the database)
-- ---------------------------------------------------------------------------
create or replace function public.is_sovereign()
 returns boolean
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND access_tier = 'SOVEREIGN'
  );
END;
$function$;

create or replace function public.handle_updated_at()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

create or replace function public.protect_profile_privileges()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  if auth.uid() is not null and not public.is_sovereign() then
    if new.access_tier is distinct from old.access_tier
       or new.is_active is distinct from old.is_active
       or new.id is distinct from old.id then
      raise exception 'Not allowed to change access tier, active status, or id';
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  local_part text := split_part(coalesce(new.email, new.id::text), '@', 1);
  nm text := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    local_part
  );
begin
  insert into public.profiles (id, full_name, display_name, handle, email)
  values (
    new.id,
    nm,
    nm,
    local_part || '-' || left(replace(new.id::text, '-', ''), 6),
    coalesce(new.email, new.id::text || '@no-email.invalid')
  )
  on conflict do nothing;
  return new;
end;
$function$;

-- Function execute rights as they stand (revoking an absent right is a no-op).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_sovereign() from public, anon;
grant execute on function public.is_sovereign() to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'profiles_updated_at' and tgrelid = 'public.profiles'::regclass) then
    create trigger profiles_updated_at before update on public.profiles
      for each row execute function public.handle_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'protect_profile_privileges' and tgrelid = 'public.profiles'::regclass) then
    create trigger protect_profile_privileges before update on public.profiles
      for each row execute function public.protect_profile_privileges();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass) then
    create trigger on_auth_user_created after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security (on for every table; not forced)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.proposals enable row level security;
alter table public.activity_log enable row level security;
alter table public.decisions enable row level security;
alter table public.entity_status enable row level security;
alter table public.log enable row level security;
alter table public.igx_conversations enable row level security;
alter table public.igx_messages enable row level security;

-- ---------------------------------------------------------------------------
-- Policies (created only where missing; existing policies are left untouched)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users view own profile') then
    create policy "Users view own profile" on public.profiles for select to public
      using ((auth.uid() = id) or public.is_sovereign());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users update own profile') then
    create policy "Users update own profile" on public.profiles for update to public
      using ((auth.uid() = id) or public.is_sovereign());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Sovereign inserts profiles') then
    create policy "Sovereign inserts profiles" on public.profiles for insert to public
      with check (public.is_sovereign() or (auth.uid() = id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'proposals' and policyname = 'sovereign account full access') then
    create policy "sovereign account full access" on public.proposals for all to public
      using (auth.uid() = '4eaf3b85-f48f-478a-96d6-388020770422'::uuid);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activity_log' and policyname = 'Sovereign reads activity_log') then
    create policy "Sovereign reads activity_log" on public.activity_log for select to authenticated
      using (auth.uid() = '4eaf3b85-f48f-478a-96d6-388020770422'::uuid);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activity_log' and policyname = 'Sovereign inserts activity_log') then
    create policy "Sovereign inserts activity_log" on public.activity_log for insert to authenticated
      with check (public.is_sovereign());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'decisions' and policyname = 'Sovereign reads decisions') then
    create policy "Sovereign reads decisions" on public.decisions for select to authenticated
      using (auth.uid() = '4eaf3b85-f48f-478a-96d6-388020770422'::uuid);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'entity_status' and policyname = 'Enable read access for anon') then
    create policy "Enable read access for anon" on public.entity_status for select to public
      using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'log' and policyname = 'Sovereign reads log') then
    create policy "Sovereign reads log" on public.log for select to authenticated
      using (public.is_sovereign());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'log' and policyname = 'Sovereign inserts log') then
    create policy "Sovereign inserts log" on public.log for insert to authenticated
      with check (public.is_sovereign());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'igx_conversations' and policyname = 'igx_conversations_governor') then
    create policy igx_conversations_governor on public.igx_conversations for all to authenticated
      using (public.is_sovereign() and (owner_id = auth.uid()))
      with check (public.is_sovereign() and (owner_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'igx_messages' and policyname = 'igx_messages_governor') then
    create policy igx_messages_governor on public.igx_messages for all to authenticated
      using (public.is_sovereign() and exists (select 1 from public.igx_conversations c where c.id = igx_messages.conversation_id and c.owner_id = auth.uid()))
      with check (public.is_sovereign() and exists (select 1 from public.igx_conversations c where c.id = igx_messages.conversation_id and c.owner_id = auth.uid()));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Realtime: tables in the supabase_realtime publication
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_log') then
    alter publication supabase_realtime add table public.activity_log;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'log') then
    alter publication supabase_realtime add table public.log;
  end if;
end $$;
