import {
  parsePublicSupabaseConfig,
  type PublicSupabaseConfig,
} from '@lunav/config'

export interface MobileSupabaseEnvironment {
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
  EXPO_PUBLIC_SUPABASE_URL?: string
}

export function getMobileSupabaseConfig(
  environment: MobileSupabaseEnvironment = {
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  }
): PublicSupabaseConfig {
  return parsePublicSupabaseConfig({
    publishableKey: environment.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    url: environment.EXPO_PUBLIC_SUPABASE_URL,
  })
}
