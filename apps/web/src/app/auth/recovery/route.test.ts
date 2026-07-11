import { afterEach, describe, expect, test, vi } from 'vitest'

const { createServerSupabaseClientMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
}))

vi.mock('../../../lib/supabase/server', () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}))

import { GET } from './route'

describe('GET /auth/recovery', () => {
  afterEach(() => {
    createServerSupabaseClientMock.mockReset()
    vi.unstubAllEnvs()
  })

  test('redirects a recovery session to reset-password with a user-bound recovery cookie', async () => {
    vi.stubEnv('WEB_ORIGIN', 'https://app.lunav.vn')
    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: { redirectType: 'recovery', user: { id: 'user-recovery' } },
          error: null,
        }),
        signOut: vi.fn(),
      },
    })

    const response = await GET(
      new Request('https://evil.example/auth/recovery?code=private-code&token=secret')
    )

    expect(response.headers.get('location')).toBe(
      'https://app.lunav.vn/reset-password'
    )
    expect(response.cookies.get('lunav-recovery-session')?.value).toBe(
      'user-recovery'
    )
  })
})
