import { describe, expect, test, vi } from 'vitest'
import { completeAuthCallback } from './auth-callback'

function createClient(result: {
  data: { redirectType: string | null; user?: { id: string } | null }
  error: { code: string } | null
}) {
  return {
    auth: {
      exchangeCodeForSession: vi.fn().mockResolvedValue(result),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }
}

describe('completeAuthCallback', () => {
  test('rejects duplicate codes before calling Supabase', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'https://app.lunav.vn/auth/confirm?code=one&code=two',
      successPath: '/sign-in?confirmed=1',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  test('completes a confirmation exchange only when redirectType is null', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'https://app.lunav.vn/auth/confirm?code=valid-code',
      successPath: '/sign-in?confirmed=1',
    })

    expect(result).toEqual({
      kind: 'success',
      path: '/sign-in?confirmed=1',
      userId: 'user-1',
    })
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid-code')
  })

  test('rejects unknown non-null confirmation flows and signs out', async () => {
    const client = createClient({
      data: { redirectType: 'invite', user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'https://app.lunav.vn/auth/confirm?code=invite-code',
      successPath: '/sign-in?confirmed=1',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })

  test('signs out a recovery session presented to the confirmation route', async () => {
    const client = createClient({
      data: { redirectType: 'recovery', user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'https://app.lunav.vn/auth/confirm?code=recovery-code',
      successPath: '/sign-in?confirmed=1',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })

  test('requires a recovery redirect for the recovery route', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'recovery',
      requestUrl: 'https://app.lunav.vn/auth/recovery?code=confirmation-code',
      successPath: '/reset-password',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })
})
