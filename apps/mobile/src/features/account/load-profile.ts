import { parseProfile, type AuthState } from '@lunav/contracts'
import {
  genericProfileLoadFailureResult,
  unauthorizedLoadProfileResult,
  type LoadProfileResult,
} from './profile-action-state'
import type { ProfileClient } from './profile-client'

export type { ProfileClient as ProfileReadClient } from './profile-client'
export type { LoadProfileResult } from './profile-action-state'

/**
 * Load the authenticated owner's profile row only. Failures stay generic so a
 * missing/foreign row never surfaces other users' data.
 */
export async function loadOwnerProfile(
  client: ProfileClient,
  authState: AuthState
): Promise<LoadProfileResult> {
  if (authState.status !== 'authenticated') {
    return unauthorizedLoadProfileResult()
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select()
      .eq('id', authState.identity.userId)
      .single()

    if (error || data === null) {
      return genericProfileLoadFailureResult()
    }

    return { kind: 'loaded', profile: parseProfile(data) }
  } catch {
    return genericProfileLoadFailureResult()
  }
}
