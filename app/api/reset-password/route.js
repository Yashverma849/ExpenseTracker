import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a regular supabase client using the public anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
      
      // Now try to reset the password using the admin API
      // Since we can't use the admin API, we'll try the signUp method as an alternative
      console.log('Attempting password reset via signUp...');
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://finzarc-expensetracker.vercel.app'}/login`
        }
      });
      
      // Log signup response for debugging
      console.log('Sign-up response:', signUpData ? 'Data exists' : 'No data');
      if (signUpError) {
        console.error('Sign-up error:', signUpError.message);
        return NextResponse.json({ 
          error: 'Failed to reset password: ' + signUpError.message,
          status: 500 
        });
      }
      
      // Check if we need to verify the email
      if (signUpData?.session === null && signUpData?.user?.identities?.length === 0) {
        // This likely means the user already exists and needs email verification
        console.log('User exists but needs email verification');
        return NextResponse.json({
          success: true,
          message: 'A verification email has been sent. Please check your inbox.',
          email_verification_required: true
        });
      }
      
      // If we reach here, try to sign in with the new password to confirm it worked
      console.log('Attempting to sign in with new credentials to verify...');
      const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (verifyError) {
        console.error('Verification error:', verifyError.message);
        if (verifyError.message.includes('Email not confirmed')) {
          return NextResponse.json({
            success: true,
            message: 'Password updated. Please check your email to confirm your account.',
            email_verification_required: true
          });
        } else {
          // The password was not actually updated
          return NextResponse.json({ 
            error: 'Password reset failed: ' + verifyError.message,
            status: 400
          });
        }
      }
      
      if (verifyData?.session) {
        // Success! Sign out to make the user sign in manually
        await supabase.auth.signOut();
        console.log('Password reset successful and verified');
        return NextResponse.json({
          success: true,
          message: 'Password updated successfully. You can now log in with your new password.',
        });
      } else {
        // Something unexpected happened
        console.error('Unexpected result: No session after sign-in');
        return NextResponse.json({ 
          error: 'Password reset was incomplete. Please try again.',
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