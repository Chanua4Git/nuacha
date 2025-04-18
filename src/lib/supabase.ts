
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// These environment variables will be provided by the Supabase integration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock Supabase client when credentials are not available
let supabase: ReturnType<typeof createClient<Database>>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please connect Supabase to your Lovable project.');
  
  // Create a mock client that doesn't throw errors but logs warnings
  const mockMethod = () => {
    console.warn('Supabase not connected. This operation will not perform any actual database operations.');
    return {
      data: null,
      error: new Error('Supabase not connected'),
      count: null,
      status: 400,
      statusText: 'Supabase not connected'
    };
  };

  const mockPromiseMethod = () => {
    console.warn('Supabase not connected. This operation will not perform any actual database operations.');
    return Promise.resolve({
      data: null,
      error: new Error('Supabase not connected')
    });
  };

  // Create a mock storage object
  const mockStorage = {
    from: () => ({
      upload: mockPromiseMethod,
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      // Add other methods as needed
    })
  };

  // Create a mock functions object
  const mockFunctions = {
    invoke: mockPromiseMethod
  };

  // Create the mock Supabase client
  supabase = {
    from: () => ({
      select: mockMethod,
      insert: mockPromiseMethod,
      update: mockPromiseMethod,
      delete: mockPromiseMethod,
      // Add other methods as needed
    }),
    storage: mockStorage as any,
    functions: mockFunctions as any,
    // Add other properties as needed
  } as any;
} else {
  // Create the real Supabase client when credentials are available
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export { supabase };
