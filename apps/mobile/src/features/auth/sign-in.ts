import { normalizeAuthState, parseSignInInput } from '@lunav/contracts'
import {
  genericFailureState,
  invalidFormState,
  mapSignInError,
  type AuthActionResult,
} from './auth-result'
import {
  resolveMobileSignInHref,
  type MobilePostSignInHref,
} from './return-path'

export interface SignInAuthClient {
  auth: {
    signInWithPassword: (input: {
      email: string
      password: string
    }) => Promise<{ error: { code?: string; message?: string } | null }>
    /**
     * Identity refresh after password success. Required so the form does not
     * claim signed-in before the protected guard can observe authenticated.
     */
    getUser: () => Promise<{
      data: {
        user: {
          email?: string
          email_confirmed_at?: string | null
          id?: string
        } | null
      }
      error: unknown | null
    }>
  }
}

export interface SignInInputFields {
  email: string
  password: string
}

export type SignInResult =
  | AuthActionResult
  | { kind: 'signed-in'; href: MobilePostSignInHref }

/**
 * Validate credentials via shared contracts, sign in, refresh identity, and
 * resolve a safe local return destination. Enumeration-safe failure mapping
 * matches web. Password success alone is not enough — identity must resolve to
 * confirmed authenticated before the form navigates.
 */
export async function signInWithEmailPassword(
  client: SignInAuthClient,
  fields: SignInInputFields,
  rawReturnTo?: string
): Promise<SignInResult> {
  // Validation failures and transport failures must stay distinct so a network
  // outage is never presented as "please check the form".
  let input: ReturnType<typeof parseSignInInput>
  try {
    input = parseSignInInput(fields)
  } catch {
    return invalidFormState()
  }

  // Resolve destination before the network call so open-redirect checks do not
  // depend on provider success timing.
  const href = resolveMobileSignInHref(rawReturnTo)

  try {
    const result = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (result.error) {
      return mapSignInError(result.error)
    }

    // signInWithPassword may emit SIGNED_IN and store tokens while the session
    // controller's void getUser() still fails. Await identity here so submit
    // stays on the form with a generic error instead of navigating early.
    const identityResult = await client.auth.getUser()

    if (identityResult.error !== null || identityResult.data.user === null) {
      return genericFailureState()
    }

    const authState = normalizeAuthState({
      email: identityResult.data.user.email,
      email_confirmed_at: identityResult.data.user.email_confirmed_at ?? null,
      id: identityResult.data.user.id,
    })

    if (authState.status === 'authenticated') {
      return { kind: 'signed-in', href }
    }

    if (authState.status === 'unconfirmed') {
      // Same enumeration-safe copy as provider email_not_confirmed.
      return mapSignInError({ code: 'email_not_confirmed' })
    }

    return genericFailureState()
  } catch {
    return genericFailureState()
  }
}
