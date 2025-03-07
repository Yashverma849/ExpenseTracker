import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
(async () => {
  const { data, error } = await supabase.from('expenses').select('*').limit(1);
  if (error) {
    console.error('Error connecting to Supabase:', error.message);
  } else {
    console.log('Supabase connection successful:', data);
  }
})();

export { supabase };