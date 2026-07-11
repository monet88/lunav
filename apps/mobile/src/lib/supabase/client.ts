import type { PublicSupabaseConfig } from '@lunav/config'
import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

type CreateClient<TClient> = (
  url: string,
  publishableKey: string,
  options: SupabaseClientOptions<'public'>
) => TClient

interface MobileSupabaseClientDependencies<TClient> {
  createClient: CreateClient<TClient>
}

const mobileAuthOptions: SupabaseClientOptions<'public'> = {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: {
      getItem: SecureStore.getItemAsync,
      removeItem: SecureStore.deleteItemAsync,
      setItem: SecureStore.setItemAsync,
    },
  },
}

export function createMobileSupabaseClient(
  config: PublicSupabaseConfig
): SupabaseClient
export function createMobileSupabaseClient<TClient>(
  config: PublicSupabaseConfig,
  dependencies: MobileSupabaseClientDependencies<TClient>
): TClient
export function createMobileSupabaseClient<TClient>(
  config: PublicSupabaseConfig,
  dependencies: MobileSupabaseClientDependencies<TClient> = {
    createClient: createClient as CreateClient<TClient>,
  }
): TClient {
  return dependencies.createClient(
    config.url,
    config.publishableKey,
    mobileAuthOptions
  )
}
