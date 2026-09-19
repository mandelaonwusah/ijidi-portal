alter function public.handle_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

revoke execute on function public.is_sovereign() from public, anon;
