import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.SUPABASE_URL!
const SUPABASE_KEY  = process.env.SUPABASE_ANON_KEY!

/** Creates a Supabase client scoped to the user's JWT — RLS is enforced transparently. */
export function createAuthedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

/** Creates an unauthed Supabase client for auth operations (signin/signup). */
export function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  })
}

export function extractToken(authHeader?: string): string | null {
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
}
