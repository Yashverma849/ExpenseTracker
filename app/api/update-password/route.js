import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    console.log('Server API: Update password requested');
    
    // Get the user from the auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    // Create a supabase client with the user's token
    const supabaseWithAuth = supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
    
    // Update the password
    const { data, error } = await supabaseWithAuth.auth.updateUser({
      password: password
    });
    
    if (error) {
      console.error('Server API: Error updating password:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Password updated successfully',
      success: true
    });
  } catch (err) {
    console.error('Server API: Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 