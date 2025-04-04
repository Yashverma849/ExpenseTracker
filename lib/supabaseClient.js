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

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Determine the site URL for auth redirects
const getSiteUrl = () => {
  // For Vercel production, use the specific production URL
  if (isBrowser && (
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('finzarc-expensetracker')
  )) {
    return 'https://finzarc-expensetracker.vercel.app';
  }
  // For local development
  return isBrowser ? window.location.origin : 'http://localhost:3000';
};

// Get additional redirect URLs based on the site URL
const getRedirectUrls = (siteUrl) => [
  `${siteUrl}/reset-password`,
  `${siteUrl}/dashboard`, 
  `${siteUrl}/login`
];

const siteUrl = getSiteUrl();

// Create and export the Supabase client with better debug options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: true, // Enable auth debugging
    flowType: 'pkce',
    // Explicitly define URLs for all auth operations
    redirectTo: `${siteUrl}/reset-password`,
    // Additional site URL configuration through code
    site_url: siteUrl,
    // Set additionalRedirectUrls (normally set in Supabase dashboard)
    additionalRedirectUrls: getRedirectUrls(siteUrl)
  }
});

// Log Supabase details
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log("Site URL for auth:", siteUrl);

// Add event listener for auth state changes to debug issues
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Auth state changed:", event);
  console.log("Session state:", session ? "Active" : "None");
});