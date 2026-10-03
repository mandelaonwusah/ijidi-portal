-- Replace the hard-coded governor account ID with the tier check is_sovereign()
-- in the three policies that still used it. Whoever holds the SOVEREIGN tier
-- now gets this access, instead of one fixed account.
--
-- Applied by hand in the Supabase SQL Editor (igx-os-production) on 2026-10-03.
-- Verified afterwards: the SOVEREIGN account sees all rows, a MEMBER sees none.

begin;

drop policy if exists "Sovereign reads activity_log" on public.activity_log;
create policy "Sovereign reads activity_log" on public.activity_log
  for select to authenticated using (public.is_sovereign());

drop policy if exists "Sovereign reads decisions" on public.decisions;
create policy "Sovereign reads decisions" on public.decisions
  for select to authenticated using (public.is_sovereign());

drop policy if exists "sovereign account full access" on public.proposals;
create policy "sovereign account full access" on public.proposals
  for all to authenticated using (public.is_sovereign()) with check (public.is_sovereign());

commit;
