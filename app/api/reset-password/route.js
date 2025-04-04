import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Create a new Supabase client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase Service Key available:', !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    try {
      console.log('Creating Supabase client with service key');
      // Create a Supabase client with the service role key
      const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // First, sign in as the user through the admin API
      console.log('Signing in as the user through admin API');
      
      // 1. Get the user by email
      const { data: getUserData, error: getUserError } = await adminAuthClient.auth.admin.listUsers();
      
      if (getUserError) {
        console.error('Error listing users:', getUserError);
        return NextResponse.json(
          { error: 'Failed to list users: ' + getUserError.message },
          { status: 500 }
        );
      }
      
      // Find the user with the matching email
      const user = getUserData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.error('User not found with email:', email);
        return NextResponse.json(
          { error: 'User not found with the provided email' },
          { status: 404 }
        );
      }
      
      console.log('Found user with ID:', user.id);
      
      // 2. Update the user's password using the admin API
      const { error: updateError } = await adminAuthClient.auth.admin.updateUserById(
        user.id,
        { password: password }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        return NextResponse.json(
          { error: 'Failed to update password: ' + updateError.message },
          { status: 500 }
        );
      }
      
      console.log('Password updated successfully');
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully. You can now log in with your new password.',
      });
    } catch (error) {
      console.error('Error in password reset operation:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to process password reset' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Reset password error:', error);
    
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + error.message },
      { status: 500 }
    );
  }
} 