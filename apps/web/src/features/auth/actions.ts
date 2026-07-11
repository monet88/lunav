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

function fields(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData)
}

export async function signUpAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    const input = parseSignUpInput(fields(formData))
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
    const input = parseForgotPasswordInput(fields(formData))
    const client = await createServerSupabaseClient()
    await client.auth.resend({
      type: 'signup',
      email: input.email,
      options: { emailRedirectTo: `${getWebOrigin()}/auth/confirm` },
    })

    return mapSignUpResult({ error: null })
  } catch {
    return invalidFormState()
  }
}

export async function forgotPasswordAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  try {
    const input = parseForgotPasswordInput(fields(formData))
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
    const input = parseSignInInput(fields(formData))
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
    const input = parseResetPasswordInput(fields(formData))
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
