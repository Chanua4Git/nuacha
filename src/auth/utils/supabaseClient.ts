
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fjrxqeyexlusjwzzecal.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcnhxZXlleGx1c2p3enplY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTMyMzAsImV4cCI6MjA2MDU2OTIzMH0.uqbiQOxbSbCr6C3LA1CkMHZ7spC5yGolK-G63JfshaY';

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});
