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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Method 2: Using admin API to reset password directly
    try {
      console.log('Attempting to get user info');
      
      // Get users to find the correct user ID
      const { data, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        throw new Error('Failed to retrieve users list: ' + listError.message);
      }
      
      if (!data || !data.users || data.users.length === 0) {
        console.error('No users found');
        throw new Error('No users found in the database');
      }
      
      console.log(`Found ${data.users.length} users`);
      
      // Find the user with the matching email
      const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.error('User not found with email:', email);
        return NextResponse.json(
          { error: 'User not found with the provided email' },
          { status: 404 }
        );
      }
      
      console.log('User found with ID:', user.id);
      
      // Update the user's password using admin API
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password }
      );
      
      if (updateError) {
        console.error('Error updating password:', updateError);
        throw new Error('Failed to update password: ' + updateError.message);
      }
      
      console.log('Password updated successfully');
      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
        method: 'admin_api'
      });
    } catch (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update password' },
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