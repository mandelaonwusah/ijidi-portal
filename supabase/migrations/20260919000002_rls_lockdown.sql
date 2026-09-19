-- RLS lockdown (applied 19 Sep 2026)
-- Governor uid: 4eaf3b85-f48f-478a-96d6-388020770422

-- proposals: remove anonymous access (the "sovereign account full access" policy stays)
drop policy if exists "Enable insert access for anon" on public.proposals;
drop policy if exists "Enable read access for anon" on public.proposals;
drop policy if exists "Enable update access for anon" on public.proposals;

-- decisions: governor-only read
drop policy if exists "Enable read access for anon" on public.decisions;
drop policy if exists "Sovereign reads decisions" on public.decisions;
create policy "Sovereign reads decisions" on public.decisions
  for select to authenticated
  using (auth.uid() = '4eaf3b85-f48f-478a-96d6-388020770422'::uuid);

-- activity_log: governor-only read
drop policy if exists "Enable read access for anon" on public.activity_log;
drop policy if exists "Sovereign reads activity_log" on public.activity_log;
create policy "Sovereign reads activity_log" on public.activity_log
  for select to authenticated
  using (auth.uid() = '4eaf3b85-f48f-478a-96d6-388020770422'::uuid);

-- log: leftover test table, governor-only read and insert
drop policy if exists "Allow admin log reads" on public.log;
drop policy if exists "Allow authenticated insert access to log" on public.log;
drop policy if exists "Allow public log inserts" on public.log;
drop policy if exists "Allow public read access to log" on public.log;
drop policy if exists "Sovereign reads log" on public.log;
drop policy if exists "Sovereign inserts log" on public.log;
create policy "Sovereign reads log" on public.log
  for select to authenticated using (public.is_sovereign());
create policy "Sovereign inserts log" on public.log
  for insert to authenticated with check (public.is_sovereign());
