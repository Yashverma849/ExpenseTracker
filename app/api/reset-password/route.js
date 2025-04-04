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

    // Get the Supabase URL and service key from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact the administrator.' },
        { status: 500 }
      );
    }

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
          error: 'Admin API error. Please try again later.',
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
          error: 'Failed to update password. Please try again later.',
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
        error: 'Operation failed. Please try again later.',
        status: 500 
      });
    }
  } catch (error) {
    console.error('Global error in reset password:', error);
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again later.',
      status: 500 
    });
  }
} 