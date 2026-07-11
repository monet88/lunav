import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getWebSupabaseConfig,
  type WebSupabaseEnvironment,
} from './config'

export function createBrowserSupabaseClient(
  environment?: WebSupabaseEnvironment
): SupabaseClient {
  const config = getWebSupabaseConfig(environment)

  return createBrowserClient(config.url, config.publishableKey)
}