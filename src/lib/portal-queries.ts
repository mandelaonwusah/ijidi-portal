import { supabase } from './supabase';

export async function getEntities() {
  const { data, error } = await supabase
    .from('entity_status')
    .select('entity_name, current_state, website_url, logo_url, last_updated');
  if (error) throw error;
  return data;
}

export async function getActivity() {
  const { data, error } = await supabase
    .from('activity_log')
    .select('id, timestamp, actor, action, entity_id')
    .order('timestamp', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data;
}
