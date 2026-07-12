import {
  parseForgotPasswordInput,
  parseSignUpInput,
} from '@lunav/contracts'
import {
  invalidFormState,
  mapConfirmationPendingResult,
  mapSignUpResult,
  type AuthActionResult,
} from './auth-result'
import { getMobileConfirmRedirectUrl } from './mobile-redirect'

export interface SignUpAuthClient {
  auth: {
    signUp: (input: {
      email: string
      password: string
      options: { emailRedirectTo: string }
    }) => Promise<{ error: { code?: string; message?: string } | null }>
    resend: (input: {
      type: 'signup'
      email: string
      options: { emailRedirectTo: string }
    }) => Promise<{ error: { code?: string; message?: string } | null }>
  }
}

export interface SignUpInputFields {
  email: string
  password: string
  passwordConfirmation: string
}

export async function signUpWithEmailPassword(
  client: SignUpAuthClient,
  fields: SignUpInputFields
): Promise<AuthActionResult> {
  try {
    const input = parseSignUpInput(fields)
    const result = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { emailRedirectTo: getMobileConfirmRedirectUrl() },
    })

    return mapSignUpResult(result)
  } catch {
    return invalidFormState()
  }
}

export async function resendSignupConfirmation(
  client: SignUpAuthClient,
  email: string
): Promise<AuthActionResult> {
  try {
    const input = parseForgotPasswordInput({ email })
    const result = await client.auth.resend({
      type: 'signup',
      email: input.email,
      options: { emailRedirectTo: getMobileConfirmRedirectUrl() },
    })

    return mapConfirmationPendingResult(result)
  } catch {
    return invalidFormState()
  }
}
