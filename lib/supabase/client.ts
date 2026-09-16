import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Keep the refresh token in persistent browser storage so mobile
        // webviews can restore the session after the app is closed.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
        secure: true,
      },
    },
  )
}
