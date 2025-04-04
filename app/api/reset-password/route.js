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
      
      console.log('User exists, proceeding with password reset flow');
      
      // Since the user exists, we'll use resetPasswordForEmail
      // This sends a reset link to the user's email
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://finzarc-expensetracker.vercel.app'}/reset-password?email=${encodeURIComponent(email)}`
        }
      );
      
      if (resetError) {
        console.error('Error sending reset email:', resetError.message);
        return NextResponse.json({ 
          error: 'Failed to initiate password reset: ' + resetError.message,
          status: 500 
        });
      }
      
      console.log('Password reset email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Password reset instructions have been sent to your email',
        email_sent: true
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