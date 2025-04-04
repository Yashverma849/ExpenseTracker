// filepath: c:\Users\verma\ExpenseTracker\lib\supabaseClient.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create and export the Supabase client with better debug options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: true, // Enable auth debugging
    flowType: 'pkce',
    // Explicitly define URLs for all auth operations
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    // Additional site URL configuration through code
    site_url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    // Set additionalRedirectUrls (normally set in Supabase dashboard)
    additionalRedirectUrls: typeof window !== 'undefined' 
      ? [`${window.location.origin}/reset-password`, `${window.location.origin}/dashboard`, `${window.location.origin}/login`]
      : ['http://localhost:3000/reset-password', 'http://localhost:3000/dashboard', 'http://localhost:3000/login']
  }
});

// Log Supabase details
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Add event listener for auth state changes to debug issues
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event);
  console.log("Session state:", session ? "Active" : "None");
});