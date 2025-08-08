import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { appConfig } from '@/config/environment';

// Validate Supabase configuration
if (!appConfig.supabase.url || !appConfig.supabase.anonKey) {
  throw new Error('Supabase configuration is missing. Please check your environment variables.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(appConfig.supabase.url, appConfig.supabase.anonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});