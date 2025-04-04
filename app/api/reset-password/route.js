import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Get the service role key from environment variables
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create both clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// Admin client with service role key for admin operations
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

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

    // Check if we have admin access
    if (!supabaseAdmin) {
      console.error('Admin access not available - service role key missing');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    try {
      // First, check if the user exists by looking them up with admin client
      console.log('Checking if user exists with email:', email);
      
      // Use admin auth to get user
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
        filter: {
          email: email
        }
      });
      
      if (userError) {
        console.error('Error looking up user:', userError);
        return NextResponse.json({
          error: 'Failed to lookup user: ' + userError.message,
          status: 500
        });
      }
      
      // Check if user exists in the results
      if (!userData?.users || userData.users.length === 0) {
        console.error('No user found with email:', email);
        return NextResponse.json({
          error: 'No account found with this email address',
          status: 404
        });
      }
      
      // User exists, get their ID
      const userId = userData.users[0].id;
      console.log('User found, updating password for user ID:', userId);
      
      // Check if email is confirmed and update if needed
      const userRecord = userData.users[0];
      const needsEmailConfirmation = !userRecord.email_confirmed_at;
      
      if (needsEmailConfirmation) {
        console.log('User email not confirmed, updating confirmation status for user ID:', userId);
        
        // Update the user to confirm their email and update password
        const { error: updateStatusError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { 
            email_confirm: true,
            confirmation_sent_at: null,
            password: password
          }
        );
        
        if (updateStatusError) {
          console.error('Error updating user status:', updateStatusError);
          return NextResponse.json({
            error: 'Failed to confirm user email: ' + updateStatusError.message,
            status: 500
          });
        }
        
        console.log('User email confirmed and password updated');
      } else {
        // Just update the password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { 
            password: password,
            confirmation_sent_at: null
          }
        );
        
        if (updateError) {
          console.error('Error updating password:', updateError);
          return NextResponse.json({
            error: 'Failed to update password: ' + updateError.message,
            status: 500
          });
        }
        
        console.log('Password updated successfully for user ID:', userId);
      }
      
      // Now verify that the password was actually updated by attempting to sign in
      console.log('Verifying password change by attempting to sign in');
      
      // Create a new Supabase client for verification to avoid session conflicts
      const verifyClient = createClient(supabaseUrl, supabaseAnonKey);
      
      const { data: signInData, error: signInError } = await verifyClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error('Failed to verify password change:', signInError);
        return NextResponse.json({
          error: 'Password was updated but could not be verified: ' + signInError.message,
          details: JSON.stringify(signInError),
          status: 500
        });
      }
      
      if (!signInData?.session) {
        console.error('No session returned after sign-in verification');
        return NextResponse.json({
          error: 'Password was updated but sign-in verification failed',
          status: 500
        });
      }
      
      // Sign out the verification client to clean up
      await verifyClient.auth.signOut();
      
      console.log('Password change verified successfully');
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Password has been updated successfully. You can now log in with your new password.'
      });
      
    } catch (error) {
      console.error('Error in reset password operation:', error);
      return NextResponse.json({ 
        error: 'Password reset failed: ' + error.message,
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