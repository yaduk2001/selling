import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');
  const accessToken = requestUrl.searchParams.get('access_token');
  const refreshToken = requestUrl.searchParams.get('refresh_token');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name, options) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(`${origin}/auth/login?error=auth_error`);
      }
      
      // Check if this is a password recovery callback
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      
    } catch (error) {
      console.error('Error in auth callback:', error);
      return NextResponse.redirect(`${origin}/auth/login?error=auth_error`);
    }
  }

  // Handle direct token-based password reset (alternative method)
  if (accessToken && refreshToken && type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password?access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`);
  }

  // Redirect to dashboard on successful authentication
  return NextResponse.redirect(`${origin}/dashboard`);
}
