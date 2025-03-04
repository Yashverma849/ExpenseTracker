// filepath: /c:/Users/verma/expensetracker/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are missing');
  throw new Error('Supabase environment variables are missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);