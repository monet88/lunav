import { afterEach, describe, expect, test, vi } from 'vitest'

const {
  clearRecoverySessionMock,
  createServerSupabaseClientMock,
  resolveCurrentAuthStateMock,
} = vi.hoisted(() => ({
  clearRecoverySessionMock: vi.fn(),
  createServerSupabaseClientMock: vi.fn(),
  resolveCurrentAuthStateMock: vi.fn(),
}))

vi.mock('../../lib/supabase/server', () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
  resolveCurrentAuthState: resolveCurrentAuthStateMock,
}))

vi.mock('../auth/recovery-session', () => ({
  clearRecoverySession: clearRecoverySessionMock,
}))

import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { signOutAction, updateProfileAction } from './actions'

describe('updateProfileAction', () => {
  afterEach(() => {
    createServerSupabaseClientMock.mockReset()
    resolveCurrentAuthStateMock.mockReset()
    clearRecoverySessionMock.mockReset()
  })

  test('does not query or update a profile before an authenticated identity is resolved', async () => {
    const from = vi.fn()
    const client = { from }
    createServerSupabaseClientMock.mockResolvedValue(client)
    resolveCurrentAuthStateMock.mockResolvedValue({ status: 'anonymous' })

    const state = await updateProfileAction(
      { kind: 'idle', message: '' },
      new FormData()
    )

    expect(state.kind).toBe('error')
    expect(from).not.toHaveBeenCalled()
  })

  test('updates only display_name for the verified user and parses the returned row', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'd102d9ea-7875-4cf4-9f01-094d8182e182',
        display_name: 'Minh',
        created_at: '2026-07-11T00:00:00.000Z',
        updated_at: '2026-07-11T00:00:00.000Z',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    const client = { from }
    createServerSupabaseClientMock.mockResolvedValue(client)
    resolveCurrentAuthStateMock.mockResolvedValue({
      status: 'authenticated',
      identity: {
        email: 'minh@example.com',
        isEmailConfirmed: true,
        userId: 'd102d9ea-7875-4cf4-9f01-094d8182e182',
      },
    })
    const formData = new FormData()
    formData.set('displayName', ' Minh ')

    const state = await updateProfileAction({ kind: 'idle', message: '' }, formData)

    expect(from).toHaveBeenCalledWith('profiles')
    expect(update).toHaveBeenCalledWith({ display_name: 'Minh' })
    expect(eq).toHaveBeenCalledWith('id', 'd102d9ea-7875-4cf4-9f01-094d8182e182')
    expect(state).toEqual({ kind: 'success', message: 'Thong tin da duoc cap nhat.' })
  })
})

describe('signOutAction', () => {
  afterEach(() => {
    createServerSupabaseClientMock.mockReset()
    resolveCurrentAuthStateMock.mockReset()
    clearRecoverySessionMock.mockReset()
  })

  test('clears the recovery marker before ending the authenticated session', async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null })
    createServerSupabaseClientMock.mockResolvedValue({ auth: { signOut } })
    resolveCurrentAuthStateMock.mockResolvedValue({
      status: 'authenticated',
      identity: {
        email: 'member@example.com',
        isEmailConfirmed: true,
        userId: 'user-1',
      },
    })

    try {
      await signOutAction()
      throw new Error('expected redirect')
    } catch (error) {
      expect(isRedirectError(error)).toBe(true)
    }

    expect(clearRecoverySessionMock).toHaveBeenCalledOnce()
    expect(signOut).toHaveBeenCalledOnce()
    expect(clearRecoverySessionMock.mock.invocationCallOrder[0]).toBeLessThan(
      signOut.mock.invocationCallOrder[0]
    )
  })
})
