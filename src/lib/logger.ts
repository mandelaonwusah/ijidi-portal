import { supabase } from './supabase';

export async function logActivity(
  action: string,
  entity: string,
  details: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    // Who did it: the signed-in user's email, otherwise SYSTEM.
    const { data: sessionData } = await supabase.auth.getSession();
    const actor = sessionData.session?.user.email ?? 'SYSTEM';

    const { error } = await supabase
      .from('activity_log')
      .insert([{ actor, action, entity_id: entity, details }]);

    if (error) {
      console.error('Failed to log activity to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to log activity:', err);
    return false;
  }
}
