import {
  parseProfile,
  parseProfileUpdate,
  type AuthState,
  type Profile,
} from '@lunav/contracts'
import {
  GENERIC_PROFILE_UPDATE_MESSAGE,
  INVALID_PROFILE_FORM_MESSAGE,
  PROFILE_UPDATE_SUCCESS_MESSAGE,
  UNAUTHORIZED_PROFILE_MESSAGE,
  type ProfileActionState,
} from './profile-action-state'

/**
 * Minimal owner-scoped profiles write seam. PromiseLike matches Supabase's
 * thenable Postgrest builders without coupling to generated table types.
 */
export interface ProfileSupabaseClient {
  from: (table: 'profiles') => {
    update: (values: { display_name: string | null }) => {
      eq: (
        column: 'id',
        value: string
      ) => {
        select: () => {
          single: () => PromiseLike<{ data: unknown; error: unknown | null }>
        }
      }
    }
  }
}

export interface ProfileUpdateFields {
  displayName: string
}

/**
 * Validate display_name via shared contracts, then update only the owner row.
 * Unauthenticated / unconfirmed states never query profiles so RLS cannot be
 * probed without a confirmed identity.
 */
export async function updateProfileDisplayName(
  client: ProfileSupabaseClient,
  authState: AuthState,
  fields: ProfileUpdateFields
): Promise<ProfileActionState> {
  if (authState.status !== 'authenticated') {
    return { kind: 'error', message: UNAUTHORIZED_PROFILE_MESSAGE }
  }

  let input: ReturnType<typeof parseProfileUpdate>
  try {
    input = parseProfileUpdate({ displayName: fields.displayName })
  } catch {
    return { kind: 'error', message: INVALID_PROFILE_FORM_MESSAGE }
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .update({ display_name: input.displayName })
      .eq('id', authState.identity.userId)
      .select()
      .single()

    if (error || data === null) {
      return { kind: 'error', message: GENERIC_PROFILE_UPDATE_MESSAGE }
    }

    const profile: Profile = parseProfile(data)
    return {
      kind: 'success',
      message: PROFILE_UPDATE_SUCCESS_MESSAGE,
      profile,
    }
  } catch {
    return { kind: 'error', message: GENERIC_PROFILE_UPDATE_MESSAGE }
  }
}
