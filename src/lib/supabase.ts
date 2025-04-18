
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// These environment variables will be provided by the Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please connect Supabase to your Lovable project.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
