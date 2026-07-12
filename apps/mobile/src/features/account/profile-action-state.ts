import type { Profile } from '@lunav/contracts'
import { accountCopy } from './account-copy'

/**
 * Stable account/profile outcome codes for UI and tests. User-facing text is
 * resolved from the copy catalog, not used as the identity of the outcome.
 */
export type ProfileActionCode =
  | 'profile.unauthorized'
  | 'profile.invalid_form'
  | 'profile.update_failed'
  | 'profile.update_success'
  | 'profile.load_failed'
  | 'profile.sign_out_failed'

export type ProfileActionState =
  | { kind: 'error'; code: ProfileActionCode; message: string }
  | { kind: 'idle'; message: '' }
  | {
      kind: 'success'
      code: ProfileActionCode
      message: string
      profile: Profile
    }

export type LoadProfileResult =
  | { kind: 'loaded'; profile: Profile }
  | {
      kind: 'unauthorized'
      code: Extract<ProfileActionCode, 'profile.unauthorized'>
      message: string
    }
  | {
      kind: 'error'
      code: Extract<ProfileActionCode, 'profile.load_failed'>
      message: string
    }

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {
  kind: 'idle',
  message: '',
}

export function unauthorizedProfileState(): Extract<
  ProfileActionState,
  { kind: 'error' }
> {
  return {
    kind: 'error',
    code: 'profile.unauthorized',
    message: accountCopy('account.error.unauthorized'),
  }
}

export function invalidProfileFormState(): Extract<
  ProfileActionState,
  { kind: 'error' }
> {
  return {
    kind: 'error',
    code: 'profile.invalid_form',
    message: accountCopy('account.error.invalidForm'),
  }
}

export function genericProfileUpdateFailureState(): Extract<
  ProfileActionState,
  { kind: 'error' }
> {
  return {
    kind: 'error',
    code: 'profile.update_failed',
    message: accountCopy('account.error.updateFailed'),
  }
}

export function profileUpdateSuccessState(
  profile: Profile
): Extract<ProfileActionState, { kind: 'success' }> {
  return {
    kind: 'success',
    code: 'profile.update_success',
    message: accountCopy('account.success.updated'),
    profile,
  }
}

export function unauthorizedLoadProfileResult(): Extract<
  LoadProfileResult,
  { kind: 'unauthorized' }
> {
  return {
    kind: 'unauthorized',
    code: 'profile.unauthorized',
    message: accountCopy('account.error.unauthorized'),
  }
}

export function genericProfileLoadFailureResult(): Extract<
  LoadProfileResult,
  { kind: 'error' }
> {
  return {
    kind: 'error',
    code: 'profile.load_failed',
    message: accountCopy('account.error.loadFailed'),
  }
}

export function genericSignOutFailureMessage(): string {
  return accountCopy('account.error.signOutFailed')
}
