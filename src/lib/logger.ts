import { createClient } from '@supabase/supabase-js';

// Read Vite client-side environment variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your Vercel Environment Variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export async function logActivity(action: string, entity: string, details: Record<string, any> = {}) {
  const { data, error } = await supabase
    .from('log')
    .insert([{ action, entity, details }]);

  if (error) {
    console.error('Failed to log activity to Supabase:', error);
    return null;
  }
  return data;
}
