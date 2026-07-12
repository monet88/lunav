import type { SupabaseClient } from '@supabase/supabase-js'
import { createMobileSupabaseClient } from './client'
import { getMobileSupabaseConfig } from './config'

let sharedClient: SupabaseClient | null = null

/**
 * Single mobile Supabase client for session lifecycle and auth actions.
 * Screens must not create their own clients against separate storage instances.
 */
export function getSharedMobileSupabaseClient(): SupabaseClient {
  if (sharedClient === null) {
    sharedClient = createMobileSupabaseClient(getMobileSupabaseConfig())
  }

  return sharedClient
}

/** Test-only reset so suites can re-inject env or mock factories. */
export function resetSharedMobileSupabaseClientForTests(): void {
  sharedClient = null
}
