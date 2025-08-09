
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// These environment variables will be provided by the Supabase integration
const supabaseUrl = 'https://fjrxqeyexlusjwzzecal.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcnhxZXlleGx1c2p3enplY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5OTMyMzAsImV4cCI6MjA2MDU2OTIzMH0.uqbiQOxbSbCr6C3LA1CkMHZ7spC5yGolK-G63JfshaY';

// Create Supabase client with the provided URL and key
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage
  }
});
