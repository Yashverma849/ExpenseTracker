import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Hardcode the service key as a fallback if environment variable is not available
// This is not ideal for security, but necessary for your specific use case
const SUPABASE_URL = 'https://ylpeqmpzkuupjntuweos.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscGVxbXB6a3V1cGpudHV3ZW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDA1NDAyOSwiZXhwIjoyMDU1NjMwMDI5fQ.5k4KwdqCWQBngxUY2QRehQFJJqWj4lMoobZ0H_Ever0';

export async function POST(req) {
  try {
    console.log('Password reset request received');
    const { email, password } = await req.json();
    console.log('Processing for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get the Supabase URL and service key, with fallbacks to hardcoded values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY;

    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Using service key (first 10 chars):', supabaseServiceKey?.substring(0, 10) + '...');

    try {
      console.log('Creating Supabase admin client');
      // Create admin client with service role key
      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Test if we can access admin functions
      console.log('Testing admin API access');
      
      // Get user by email first
      console.log('Attempting to fetch user data for email:', email);
      
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        return NextResponse.json({ 
          error: 'Admin API error: ' + listError.message,
          status: 500 
        });
      }
      
      console.log('Successfully retrieved users list, count:', users?.length || 0);
      
      // Find the user with the matching email
      const user = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.log('User not found with email:', email);
        return NextResponse.json({ 
          error: 'User not found with the provided email',
          status: 404 
        });
      }
      
      console.log('Found user. Attempting to update password for user ID:', user.id);
      
      // Update the user's password
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        user.id,
        { password: password }
      );
      
      if (updateError) {
        console.error('Error updating password:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update password: ' + updateError.message,
          status: 500 
        });
      }
      
      console.log('Password updated successfully for user:', user.id);
      
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully. You can now log in with your new password.'
      });
      
    } catch (error) {
      console.error('Error in reset password operation:', error);
      return NextResponse.json({ 
        error: 'Operation failed: ' + error.message,
        status: 500 
      });
    }
  } catch (error) {
    console.error('Global error in reset password:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred: ' + error.message,
      status: 500 
    });
  }
} 