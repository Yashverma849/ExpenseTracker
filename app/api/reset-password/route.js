import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { email, redirectUrl: requestRedirectUrl } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    console.log('Server API: Reset password requested for:', email);
    
    // Get the host from the request headers
    const host = request.headers.get('host');
    // Detect if we're on Vercel production
    const isProduction = !host.includes('localhost') && (
      host.includes('vercel.app') || 
      host.includes('finzarc-expensetracker')
    );
    
    // Use the explicit production URL for Vercel deployments or the one provided in the request
    const redirectUrl = requestRedirectUrl || (isProduction
      ? 'https://finzarc-expensetracker.vercel.app/reset-password'
      : `http://${host}/reset-password`);
    
    console.log('Server API: Using redirect URL:', redirectUrl);
    
    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      console.error('Server API: Error sending reset email:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Password reset email sent successfully',
      data
    });
  } catch (err) {
    console.error('Server API: Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 