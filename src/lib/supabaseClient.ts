import { createClient } from '@supabase/supabase-js';

// Ensure we use the connection pooling port (6543) instead of direct connection (5432)
// This is critical for serverless environments to avoid connection exhaustion.
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
if (supabaseUrl.includes(':5432')) {
  supabaseUrl = supabaseUrl.replace(':5432', ':6543');
}

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
