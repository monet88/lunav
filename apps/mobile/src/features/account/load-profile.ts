import {
  parseProfile,
  type AuthState,
  type Profile,
} from '@lunav/contracts'
import {
  GENERIC_PROFILE_LOAD_MESSAGE,
  UNAUTHORIZED_PROFILE_MESSAGE,
} from './profile-action-state'

/**
 * Minimal owner-scoped profiles read seam. PromiseLike matches Supabase's
 * thenable Postgrest builders without coupling to generated table types.
 */
export interface ProfileReadClient {
  from: (table: 'profiles') => {
    select: (columns?: string) => {
      eq: (
        column: 'id',
        value: string
      ) => {
        single: () => PromiseLike<{ data: unknown; error: unknown | null }>
      }
    }
  }
}

export type LoadProfileResult =
  | { kind: 'loaded'; profile: Profile }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'error'; message: string }

/**
 * Load the authenticated owner's profile row only. Failures stay generic so a
 * missing/foreign row never surfaces other users' data.
 */
export async function loadOwnerProfile(
  client: ProfileReadClient,
  authState: AuthState
): Promise<LoadProfileResult> {
  if (authState.status !== 'authenticated') {
    return { kind: 'unauthorized', message: UNAUTHORIZED_PROFILE_MESSAGE }
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select()
      .eq('id', authState.identity.userId)
      .single()

    if (error || data === null) {
      return { kind: 'error', message: GENERIC_PROFILE_LOAD_MESSAGE }
    }

    return { kind: 'loaded', profile: parseProfile(data) }
  } catch {
    return { kind: 'error', message: GENERIC_PROFILE_LOAD_MESSAGE }
  }
}
