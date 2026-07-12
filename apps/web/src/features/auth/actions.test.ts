import { afterEach, describe, expect, test, vi } from 'vitest'

const {
  clearRecoverySessionMock,
  createServerSupabaseClientMock,
  hasRecoverySessionMock,
  resolveCurrentAuthStateMock,
} = vi.hoisted(() => ({
  clearRecoverySessionMock: vi.fn(),
  createServerSupabaseClientMock: vi.fn(),
  hasRecoverySessionMock: vi.fn(),
  resolveCurrentAuthStateMock: vi.fn(),
}))

vi.mock('../../lib/supabase/server', () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
  resolveCurrentAuthState: resolveCurrentAuthStateMock,
}))

vi.mock('./recovery-session', () => ({
  clearRecoverySession: clearRecoverySessionMock,
  hasRecoverySession: hasRecoverySessionMock,
}))

import { INITIAL_FORM_STATE } from './action-state'
import { resetPasswordAction, signInAction, signUpAction } from './actions'
import { isRedirectError } from './is-redirect-error'

describe('signUpAction', () => {
  afterEach(() => {
    createServerSupabaseClientMock.mockReset()
    resolveCurrentAuthStateMock.mockReset()
    hasRecoverySessionMock.mockReset()
    clearRecoverySessionMock.mockReset()
    vi.unstubAllEnvs()
  })

  test('uses the canonical confirmation callback and returns an enumeration-safe result', async () => {
    vi.stubEnv('WEB_ORIGIN', 'http://127.0.0.1:3000')
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { code: 'email_exists', message: 'provider detail' },
    })
    createServerSupabaseClientMock.mockResolvedValue({ auth: { signUp } })
    const formData = new FormData()
    formData.set('email', 'member@example.com')
    formData.set('password', 'password12')
    formData.set('passwordConfirmation', 'password12')

    const state = await signUpAction(INITIAL_FORM_STATE, formData)

    expect(signUp).toHaveBeenCalledWith({
      email: 'member@example.com',
      password: 'password12',
      options: { emailRedirectTo: 'http://127.0.0.1:3000/auth/confirm' },
    })
    expect(state).toEqual({
      kind: 'confirmation-pending',
      message: 'Neu dia chi email hop le, ban se nhan duoc huong dan xac nhan.',
    })
  })

  test('ignores Next.js server-action bookkeeping fields in FormData', async () => {
    vi.stubEnv('WEB_ORIGIN', 'http://127.0.0.1:3000')
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    })
    createServerSupabaseClientMock.mockResolvedValue({ auth: { signUp } })
    const formData = new FormData()
    formData.set('$ACTION_ID_signUpAction', '')
    formData.set('$ACTION_KEY', '1')
    formData.set('email', 'member@example.com')
    formData.set('password', 'password12')
    formData.set('passwordConfirmation', 'password12')

    const state = await signUpAction(INITIAL_FORM_STATE, formData)

    expect(signUp).toHaveBeenCalledOnce()
    expect(state).toEqual({
      kind: 'confirmation-pending',
      message: 'Neu dia chi email hop le, ban se nhan duoc huong dan xac nhan.',
    })
  })
})

describe('signInAction', () => {
  afterEach(() => {
    createServerSupabaseClientMock.mockReset()
    resolveCurrentAuthStateMock.mockReset()
    hasRecoverySessionMock.mockReset()
    clearRecoverySessionMock.mockReset()
  })

  test('ignores returnTo when validating credentials and redirects to a safe destination', async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    createServerSupabaseClientMock.mockResolvedValue({
      auth: { signInWithPassword },
    })
    const formData = new FormData()
    formData.set('email', 'member@example.com')
    formData.set('password', 'password12')
    formData.set('returnTo', '/account')

    try {
      await signInAction(INITIAL_FORM_STATE, formData)
      throw new Error('expected redirect')
    } catch (error) {
      expect(isRedirectError(error)).toBe(true)
    }

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'member@example.com',
      password: 'password12',
    })
  })
})

describe('resetPasswordAction', () => {
  afterEach(() => {
    createServerSupabaseClientMock.mockReset()
    resolveCurrentAuthStateMock.mockReset()
    hasRecoverySessionMock.mockReset()
    clearRecoverySessionMock.mockReset()
  })

  test('rejects recovery markers that do not match the verified user', async () => {
    const updateUser = vi.fn()
    createServerSupabaseClientMock.mockResolvedValue({ auth: { updateUser } })
    resolveCurrentAuthStateMock.mockResolvedValue({
      status: 'authenticated',
      identity: {
        email: 'member@example.com',
        isEmailConfirmed: true,
        userId: 'user-b',
      },
    })
    hasRecoverySessionMock.mockResolvedValue(false)
    const formData = new FormData()
    formData.set('password', 'password12')
    formData.set('passwordConfirmation', 'password12')

    const state = await resetPasswordAction(INITIAL_FORM_STATE, formData)

    expect(hasRecoverySessionMock).toHaveBeenCalledWith('user-b')
    expect(updateUser).not.toHaveBeenCalled()
    expect(state.kind).toBe('error')
  })
})
