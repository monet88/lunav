'use server'

import { parseProfile, parseProfileUpdate } from '@lunav/contracts'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient, resolveCurrentAuthState } from '../../lib/supabase/server'
import { clearRecoverySession } from '../auth/recovery-session'
import type { ProfileActionState } from './action-state'

const UNAUTHORIZED_MESSAGE = 'Vui long dang nhap lai de tiep tuc.'
const INVALID_FORM_MESSAGE = 'Vui long kiem tra lai thong tin da nhap.'
const GENERIC_FAILURE_MESSAGE = 'Khong the cap nhat thong tin. Vui long thu lai.'
const SUCCESS_MESSAGE = 'Thong tin da duoc cap nhat.'

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const client = await createServerSupabaseClient()
  const authState = await resolveCurrentAuthState(client)

  if (authState.status !== 'authenticated') {
    return { kind: 'error', message: UNAUTHORIZED_MESSAGE }
  }

  try {
    const input = parseProfileUpdate({
      displayName: formData.get('displayName'),
    })
    const { data, error } = await client
      .from('profiles')
      .update({ display_name: input.displayName })
      .eq('id', authState.identity.userId)
      .select()
      .single()

    if (error || data === null) {
      return { kind: 'error', message: GENERIC_FAILURE_MESSAGE }
    }

    parseProfile(data)
    return { kind: 'success', message: SUCCESS_MESSAGE }
  } catch {
    return { kind: 'error', message: INVALID_FORM_MESSAGE }
  }
}

export async function signOutAction(): Promise<void> {
  const client = await createServerSupabaseClient()
  const authState = await resolveCurrentAuthState(client)

  if (authState.status !== 'authenticated') {
    redirect('/sign-in')
  }

  await clearRecoverySession()

  try {
    const { error } = await client.auth.signOut()

    if (error) {
      redirect('/account')
    }
  } catch {
    redirect('/account')
  }

  redirect('/sign-in')
}
