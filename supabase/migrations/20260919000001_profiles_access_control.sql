-- Profiles access control (applied 19 Sep 2026)
-- access_tier enum: SOVEREIGN, CLIENT, DEMO, MEMBER (default MEMBER)

-- 1. Stop non-sovereign users changing their own tier, active flag or id
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
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
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

-- 2. Every new sign-up gets a MEMBER profile (tier is never read from user metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3. Backfill any existing auth user that has no profile yet (as MEMBER)
insert into public.profiles (id, full_name, display_name, handle, email)
select u.id, split_part(u.email, '@', 1), split_part(u.email, '@', 1),
       split_part(u.email, '@', 1) || '-' || left(replace(u.id::text, '-', ''), 6),
       u.email
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
