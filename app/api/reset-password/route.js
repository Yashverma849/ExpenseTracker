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
      // Custom approach: First sign in with email only to check if user exists
      console.log('Checking if user exists with email:', email);
      
      // 1. Try to sign in with email but with a dummy password
      // This will fail but let us know if the user exists
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-that-will-fail',
      });
      
      // Check if user exists (error will be "Invalid login credentials" if user exists)
      // If error is something else like "Email not confirmed", user also exists
      if (signInError && !signInError.message.includes('Invalid login credentials') && 
          !signInError.message.includes('Email not confirmed')) {
        console.error('Error checking user:', signInError);
        return NextResponse.json({ 
          error: 'User with this email not found', 
          status: 404 
        });
      }
      
      // 2. If we reach here, user exists. Now we try to update the password
      // For this, we use the signUp method with existing email and new password
      // This might sound counter-intuitive, but in Supabase, signUp with existing email but
      // different password can update the password if email confirmation is disabled
      console.log('User exists. Attempting to update password');
      
      const { error: updateError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://finzarc-expensetracker.vercel.app'}/login`
        }
      });
      
      if (updateError) {
        console.error('Error updating password:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update password. Please try again later.',
          status: 500 
        });
      }
      
      console.log('Password update initiated for user');
      
      // 3. Try signing in with new credentials to see if it worked
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!verifyError) {
        // If sign in works, password was updated successfully and immediately
        console.log('Password updated successfully and verified');
        return NextResponse.json({
          success: true,
          message: 'Password updated successfully. You can now log in with your new password.',
        });
      } else if (verifyError.message.includes('Email not confirmed')) {
        // This means the password was updated but email verification is required
        console.log('Password updated but email verification is required');
        return NextResponse.json({
          success: true,
          message: 'Password updated. Please check your email to confirm your account.',
          email_verification_required: true
        });
      } else {
        // Password update may have failed in an unexpected way
        console.error('Error verifying password update:', verifyError);
        return NextResponse.json({ 
          error: 'Unable to verify password update. Please try again later.',
          status: 500 
        });
      }
      
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