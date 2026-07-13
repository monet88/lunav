import {
  parseProfile,
  parseProfileUpdate,
  type AuthState,
} from '@lunav/contracts'
import {
  genericProfileUpdateFailureState,
  invalidProfileFormState,
  profileUpdateSuccessState,
  unauthorizedProfileState,
  type ProfileActionState,
} from './profile-action-state'
import type { ProfileClient } from './profile-client'

export type { ProfileClient as ProfileSupabaseClient } from './profile-client'

export interface ProfileUpdateFields {
  displayName: string
}

/**
 * Validate display_name via shared contracts, then update only the owner row.
 * Unauthenticated / unconfirmed states never query profiles so RLS cannot be
 * probed without a confirmed identity.
 */
export async function updateProfileDisplayName(
  client: ProfileClient,
  authState: AuthState,
  fields: ProfileUpdateFields
): Promise<ProfileActionState> {
  if (authState.status !== 'authenticated') {
    return unauthorizedProfileState()
  }

  let input: ReturnType<typeof parseProfileUpdate>
  try {
    input = parseProfileUpdate({ displayName: fields.displayName })
  } catch {
    return invalidProfileFormState()
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .update({ display_name: input.displayName })
      .eq('id', authState.identity.userId)
      .select()
      .single()

    if (error || data === null) {
      return genericProfileUpdateFailureState()
    }

    return profileUpdateSuccessState(parseProfile(data))
  } catch {
    return genericProfileUpdateFailureState()
  }
}
