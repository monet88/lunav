import { completeAuthCallback } from './auth-callback'

function createClient(result: {
  data: { redirectType: string | null; user?: { id: string } | null }
  error: { code: string } | null
}) {
  return {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue(result),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  }
}

describe('completeAuthCallback (mobile)', () => {
  test('rejects missing code before calling Supabase', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'lunav://auth/confirm',
      successPath: '/',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })

  test('rejects duplicate codes before calling Supabase', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'lunav://auth/confirm?code=one&code=two',
      successPath: '/',
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
      requestUrl: 'lunav://auth/confirm?code=valid-code',
      successPath: '/',
    })

    expect(result).toEqual({
      kind: 'success',
      path: '/',
      userId: 'user-1',
    })
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      'valid-code'
    )
    expect(client.auth.signOut).not.toHaveBeenCalled()
  })

  test('rejects unknown non-null confirmation flows and signs out', async () => {
    const client = createClient({
      data: { redirectType: 'invite', user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'lunav://auth/confirm?code=invite-code',
      successPath: '/',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.signOut).toHaveBeenCalledTimes(1)
  })

  test('signs out a recovery session presented to the confirmation route', async () => {
    const client = createClient({
      data: { redirectType: 'recovery', user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'lunav://auth/confirm?code=recovery-code',
      successPath: '/',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.signOut).toHaveBeenCalledTimes(1)
  })

  test('maps exchange provider errors to failure without signing out again', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: { code: 'flow_state_expired' },
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'lunav://auth/confirm?code=expired-code',
      successPath: '/',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.signOut).not.toHaveBeenCalled()
  })

  test('rejects blank codes', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })

    const result = await completeAuthCallback({
      client,
      expectedRedirectType: 'confirmation',
      requestUrl: 'lunav://auth/confirm?code=%20%20',
      successPath: '/',
    })

    expect(result).toEqual({ kind: 'failure' })
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled()
  })
})
