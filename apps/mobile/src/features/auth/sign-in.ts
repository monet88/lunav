import { parseSignInInput } from '@lunav/contracts'
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
 * Validate credentials via shared contracts, sign in, and resolve a safe local
 * return destination. Enumeration-safe failure mapping matches web.
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

    return { kind: 'signed-in', href }
  } catch {
    return genericFailureState()
  }
}
