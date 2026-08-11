import { supabase } from './supabase';

export async function getEntities() {
  const { data, error } = await supabase
    .from('entity_status')
    .select('entity_name, current_state, website_url, logo_url, last_updated');
  if (error) throw error;
  return data;
}
