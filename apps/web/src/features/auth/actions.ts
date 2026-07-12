'use server'

import {
  parseAuthReturnDestination,
  parseForgotPasswordInput,
  parseResetPasswordInput,
  parseSignInInput,
  parseSignUpInput,
} from '@lunav/contracts'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, resolveCurrentAuthState } from '../../lib/supabase/server'
import {
  mapConfirmationPendingResult,
  mapForgotPasswordResult,
  mapSignInError,
  mapSignUpResult,
} from './auth-result'
import type { FormActionState } from './action-state'
import { getWebOrigin } from './web-origin'
import { clearRecoverySession, hasRecoverySession } from './recovery-session'

function invalidFormState(): FormActionState {
  return { kind: 'error', message: 'Vui long kiem tra lai thong tin da nhap.' }
}

function genericFailureState(): FormActionState {
  return { kind: 'error', message: 'Khong the hoan tat yeu cau. Vui long thu lai.' }
}

function pickFields(
  formData: FormData,
  keys: readonly string[]
): Record<string, FormDataEntryValue> {
  // Next.js server actions inject bookkeeping fields such as $ACTION_ID_*.
  // Strict web-auth contracts must only see the declared form inputs.
  // Omit missing keys instead of passing null so Zod optional/default fields
  // keep receiving string | undefined rather than null.
  const result: Record<string, FormDataEntryValue> = {}

  for (const key of keys) {
    const value = formData.get(key)
    if (value !== null) {
      result[key] = value
    }
  }

  return result
}

export async function signUpAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    const input = parseSignUpInput(
      pickFields(formData, ['email', 'password', 'passwordConfirmation'])
    )
    const client = await createServerSupabaseClient()
    const result = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { emailRedirectTo: `${getWebOrigin()}/auth/confirm` },
    })

    return mapSignUpResult(result)
  } catch {
    return invalidFormState()
  }
}

export async function resendConfirmationAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    const input = parseForgotPasswordInput(pickFields(formData, ['email']))
    const client = await createServerSupabaseClient()
    const result = await client.auth.resend({
      type: 'signup',
      email: input.email,
      options: { emailRedirectTo: `${getWebOrigin()}/auth/confirm` },
    })

    return mapConfirmationPendingResult(result)
  } catch {
    return invalidFormState()
  }
}

export async function forgotPasswordAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    const input = parseForgotPasswordInput(pickFields(formData, ['email']))
    const client = await createServerSupabaseClient()
    const result = await client.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${getWebOrigin()}/auth/recovery`,
    })

    return mapForgotPasswordResult(result)
  } catch {
    return invalidFormState()
  }
}

export async function signInAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  let returnDestination = '/'

  try {
    // returnTo is a routing field, not part of the strict sign-in schema.
    const input = parseSignInInput(pickFields(formData, ['email', 'password']))
    returnDestination = parseAuthReturnDestination(
      String(formData.get('returnTo') ?? '')
    )
    const client = await createServerSupabaseClient()
    const result = await client.auth.signInWithPassword(input)

    if (result.error) {
      return mapSignInError(result.error)
    }
  } catch {
    return invalidFormState()
  }

  redirect(returnDestination)
}

export async function resetPasswordAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    const input = parseResetPasswordInput(
      pickFields(formData, ['password', 'passwordConfirmation'])
    )
    const client = await createServerSupabaseClient()
    const authState = await resolveCurrentAuthState(client)

    if (
      authState.status !== 'authenticated' ||
      !(await hasRecoverySession(authState.identity.userId))
    ) {
      return genericFailureState()
    }

    const result = await client.auth.updateUser({ password: input.password })
    if (result.error) {
      return genericFailureState()
    }

    await clearRecoverySession()
    return { kind: 'confirmation-pending', message: 'Mat khau da duoc cap nhat.' }
  } catch {
    return invalidFormState()
  }
}
