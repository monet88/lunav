import {
  parsePublicSupabaseConfig,
  type PublicSupabaseConfig,
} from '@lunav/config'

export interface WebSupabaseEnvironment {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
}

export function getWebSupabaseConfig(
  environment: WebSupabaseEnvironment = {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  }
): PublicSupabaseConfig {
  return parsePublicSupabaseConfig({
    publishableKey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    url: environment.NEXT_PUBLIC_SUPABASE_URL,
  })
}