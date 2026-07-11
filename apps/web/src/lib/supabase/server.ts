import { normalizeAuthState, type AuthState } from '@lunav/contracts'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import {
  getWebSupabaseConfig,
  type WebSupabaseEnvironment,
} from './config'

interface VerifiedUserClient {
  auth: {
    getUser: () => Promise<{
      data: { user: User | null }
      error: unknown
    }>
  }
}

function toAuthState(user: User | null): AuthState {
  if (user === null) {
    return { status: 'anonymous' }
  }

  try {
    return normalizeAuthState({
      email: user.email,
      email_confirmed_at: user.email_confirmed_at ?? null,
      id: user.id,
    })
  } catch {
    return { status: 'anonymous' }
  }
}

export async function createServerSupabaseClient(
  environment?: WebSupabaseEnvironment
): Promise<SupabaseClient> {
  const config = getWebSupabaseConfig(environment)
  const cookieStore = await cookies()

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
    },
  })
}

export async function resolveCurrentAuthState(
  client: VerifiedUserClient
): Promise<AuthState> {
  try {
    const { data, error } = await client.auth.getUser()

    if (error) {
      return { status: 'anonymous' }
    }

    return toAuthState(data.user)
  } catch {
    return { status: 'anonymous' }
  }
}