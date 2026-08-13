import { createClient } from '@supabase/supabase-js';

// Checks both standard Node environment variables and Vite client environment variables
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL);

const supabaseAnonKey = 
  process.env.SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing from environment variables.');
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
