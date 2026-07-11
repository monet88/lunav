import { afterEach, describe, expect, test, vi } from 'vitest'

const { createServerSupabaseClientMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
}))

vi.mock('../../../lib/supabase/server', () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}))

import { GET } from './route'

describe('GET /auth/confirm', () => {
  afterEach(() => {
    createServerSupabaseClientMock.mockReset()
    vi.unstubAllEnvs()
  })

  test('redirects a successful confirmation using the configured origin without retaining callback query values', async () => {
    vi.stubEnv('WEB_ORIGIN', 'https://app.lunav.vn')
    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: { redirectType: null, user: { id: 'user-1' } },
          error: null,
        }),
        signOut: vi.fn(),
      },
    })

    const response = await GET(
      new Request('https://evil.example/auth/confirm?code=private-code&error=provider-error')
    )

    expect(response.headers.get('location')).toBe(
      'https://app.lunav.vn/sign-in?confirmed=1'
    )
  })

  test('clears a recovery session and redirects to a safe confirmation status page', async () => {
    vi.stubEnv('WEB_ORIGIN', 'https://app.lunav.vn')
    const signOut = vi.fn().mockResolvedValue({ error: null })
    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: { redirectType: 'recovery', user: { id: 'user-1' } },
          error: null,
        }),
        signOut,
      },
    })

    const response = await GET(
      new Request('https://evil.example/auth/confirm?code=private-code')
    )

    expect(signOut).toHaveBeenCalledOnce()
    expect(response.headers.get('location')).toBe(
      'https://app.lunav.vn/confirm-email?status=error'
    )
  })
})
