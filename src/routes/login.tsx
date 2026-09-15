import { supabase } from './supabase';

export async function logActivity(
  action: string,
  entity: string,
  details: Record<string, any> = {},
) {
  const { data, error } = await supabase
    .from('activity_log')
    .insert([{ action, entity, details }]);

  if (error) {
    console.error('Failed to log activity to Supabase:', error);
    return null;
  }

  return data;
}
