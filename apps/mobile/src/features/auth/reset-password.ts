import {
  normalizeAuthState,
  parseResetPasswordInput,
} from '@lunav/contracts'
import {
  genericFailureState,
  invalidFormState,
  passwordUpdatedMessage,
  type AuthActionResult,
} from './auth-result'
import {
  clearRecoverySession,
  hasRecoverySession,
  type RecoverySessionStore,
} from './recovery-session'

export interface ResetPasswordAuthClient {
  auth: {
    getUser: () => Promise<{
      data?: {
        user?: {
          email?: string
          email_confirmed_at?: string | null
          id?: string
        } | null
      } | null
      error: unknown | null
    }>
    updateUser: (input: {
      password: string
    }) => Promise<{ error: { code?: string; message?: string } | null }>
  }
}

export interface ResetPasswordInputFields {
  password: string
  passwordConfirmation: string
}

export type ResetPasswordResult =
  | AuthActionResult
  | { kind: 'password-updated'; message: string }

/**
 * Update password only when the live session is authenticated and a mobile
 * recovery proof is present for that userId. Clears the proof after success.
 */
export async function resetPasswordWithRecoveryProof(
  client: ResetPasswordAuthClient,
  fields: ResetPasswordInputFields,
  store?: RecoverySessionStore
): Promise<ResetPasswordResult> {
  let input: ReturnType<typeof parseResetPasswordInput>
  try {
    input = parseResetPasswordInput(fields)
  } catch {
    return invalidFormState()
  }

  try {
    const identityResult = await client.auth.getUser()
    const user = identityResult.data?.user

    if (identityResult.error !== null || !user) {
      return genericFailureState()
    }

    const authState = normalizeAuthState({
      email: user.email,
      email_confirmed_at: user.email_confirmed_at ?? null,
      id: user.id,
    })

    if (authState.status !== 'authenticated') {
      return genericFailureState()
    }

    const allowed = await hasRecoverySession(
      authState.identity.userId,
      store
    )
    if (!allowed) {
      return genericFailureState()
    }

    const result = await client.auth.updateUser({ password: input.password })
    if (result.error) {
      return genericFailureState()
    }

    // Password mutation already succeeded. Cleanup is best-effort so a
    // SecureStore failure does not ask the user to retry an applied update.
    try {
      await clearRecoverySession(store)
    } catch {
      // Best-effort only: the recovery proof may linger until TTL/expiry.
    }
    return { kind: 'password-updated', message: passwordUpdatedMessage() }
  } catch {
    return genericFailureState()
  }
}
