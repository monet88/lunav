import { parseForgotPasswordInput } from '@lunav/contracts'
import {
  genericFailureState,
  invalidFormState,
  mapForgotPasswordResult,
  type AuthActionResult,
} from './auth-result'
import { getMobileRecoveryRedirectUrl } from './mobile-redirect'

export interface ForgotPasswordAuthClient {
  auth: {
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string }
    ) => Promise<{ error: { code?: string; message?: string } | null }>
  }
}

export interface ForgotPasswordInputFields {
  email: string
}

/**
 * Validate email via shared contracts and request a recovery email that lands
 * on the local recovery deep link. Non-rate-limit outcomes stay enumeration-safe.
 */
export async function requestPasswordRecovery(
  client: ForgotPasswordAuthClient,
  fields: ForgotPasswordInputFields
): Promise<AuthActionResult> {
  let input: ReturnType<typeof parseForgotPasswordInput>
  try {
    input = parseForgotPasswordInput(fields)
  } catch {
    return invalidFormState()
  }

  try {
    const result = await client.auth.resetPasswordForEmail(input.email, {
      redirectTo: getMobileRecoveryRedirectUrl(),
    })

    return mapForgotPasswordResult(result)
  } catch {
    return genericFailureState()
  }
}
