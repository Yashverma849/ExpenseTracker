import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use standard client - no email methods
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    try {
      // First, check if the user exists by trying to sign in
      console.log('Checking if user exists with email:', email);
      
      // Try to sign in with dummy password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-that-should-fail',
      });
      
      // Log the specific error for debugging
      if (signInError) {
        console.log('Sign-in error type:', signInError.message);
      }
      
      // Check user existence based on error message
      // If the error isn't about invalid credentials or unconfirmed email,
      // then the user likely doesn't exist
      if (signInError && 
          !signInError.message.includes('Invalid login credentials') && 
          !signInError.message.includes('Email not confirmed')) {
        console.error('User likely does not exist:', signInError.message);
        return NextResponse.json({ 
          error: 'No account found with this email address', 
          status: 404 
        });
      }
      
      console.log('User exists, proceeding with direct password update');
      
      // Try to update user password
      // Rather than using resetPasswordForEmail, we're going to try using signUp
      // which can sometimes update a password when email confirmation is disabled
      
      // 1. First, try to sign up with the same email but new password
      console.log('Attempting to update password via signUp method');
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Don't use email redirect flow - this is just for consistency
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://finzarc-expensetracker.vercel.app'}/login`,
        },
      });
      
      if (signUpError) {
        // If we get "User already registered", it means we can't use this method
        if (signUpError.message.includes('already registered')) {
          console.log('SignUp method failed due to existing user');
          return NextResponse.json({
            error: 'Unable to reset password directly. Please contact support for assistance.',
            status: 400
          });
        }
        
        console.error('Error in signUp attempt:', signUpError.message);
        return NextResponse.json({
          error: 'Password reset failed: ' + signUpError.message,
          status: 500
        });
      }
      
      // If we reach here, let's try a different approach
      // 2. Try to sign in with the new credentials to see if it worked
      console.log('Attempting to verify new credentials');
      
      const { data: signInData, error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (verifyError) {
        if (verifyError.message.includes('Email not confirmed')) {
          // This means the password update might have worked but email verification is required
          console.log('Email confirmation required after password update');
          return NextResponse.json({
            success: false,
            error: 'Email verification required to complete the process',
            status: 400
          });
        }
        
        console.error('Verification error:', verifyError.message);
        return NextResponse.json({
          error: 'Failed to verify password update: ' + verifyError.message,
          status: 400
        });
      }
      
      // If we got here and have a session, the password was updated successfully
      if (signInData?.session) {
        // Sign out to force user to log in with new credentials
        await supabase.auth.signOut();
        
        console.log('Password reset successful and verified');
        return NextResponse.json({
          success: true,
          message: 'Password has been updated successfully. You can now log in with your new password.'
        });
      } else {
        // Unexpected response - we should have either an error or a session
        console.error('Unexpected response: No session after sign-in');
        return NextResponse.json({
          error: 'Something went wrong during password reset verification',
          status: 500
        });
      }
      
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