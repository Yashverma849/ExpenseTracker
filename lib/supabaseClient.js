// filepath: c:\Users\verma\ExpenseTracker\lib\supabaseClient.js
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Handle site URL in a way that works in both client and server environments
let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl && typeof window !== 'undefined') {
  siteUrl = window.location.origin;
} else if (!siteUrl) {
  // Fallback for server-side
  siteUrl = 'https://finzarc-expensetracker.vercel.app';
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Create Supabase client with additional configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Don't set a global redirectTo here as it will be overridden for specific calls
  },
});

console.log("Supabase client initialized with site URL:", siteUrl);
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);