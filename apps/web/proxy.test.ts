import type { User } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { createServerClientMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

import { config, proxy } from './proxy'

type ProxyCookieBatch = Array<{
  name: string
  options: { httpOnly?: boolean; path?: string }
  value: string
}>

const cacheControlHeaders = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
  Expires: '0',
  Pragma: 'no-cache',
}

function createAuthUser(
  overrides: Partial<User> & Pick<User, 'id'>
): User {
  return {
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-07-11T00:00:00.000Z',
    user_metadata: {},
    ...overrides,
  }
}

function mockGetUserResult(result: {
  data: { user: User | null }
  error: Error | null
}): ReturnType<typeof vi.fn> {
  const getUser = vi.fn().mockResolvedValue(result)
  createServerClientMock.mockReturnValue({ auth: { getUser } })
  return getUser
}

describe('proxy', () => {
  beforeEach(() => {
    createServerClientMock.mockReset()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-key')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
  })

  test('matches only account paths', () => {
    expect(config).toEqual({ matcher: '/account/:path*' })
  })

  test('reads request cookies and writes refreshed cookies to pass-through response', async () => {
    const getUser = mockGetUserResult({
      data: {
        user: createAuthUser({
          email: 'confirmed@example.com',
          email_confirmed_at: '2026-07-11T00:00:00.000Z',
          id: 'user-confirmed',
        }),
      },
      error: null,
    })
    const request = new NextRequest('https://app.lunav.vn/account', {
      headers: { cookie: 'sb-session=existing-cookie' },
    })

    const response = await proxy(request)

    expect(getUser).toHaveBeenCalledOnce()
    const options = createServerClientMock.mock.calls[0]?.[2] as {
      cookies: {
        getAll: () => Array<{ name: string; value: string }>
        setAll: (
          cookies: ProxyCookieBatch,
          headers: Record<string, string>
        ) => void
      }
    }
    expect(options.cookies.getAll()).toEqual([
      { name: 'sb-session', value: 'existing-cookie' },
    ])

    options.cookies.setAll(
      [
        {
          name: 'sb-session',
          options: { httpOnly: true, path: '/' },
          value: 'refreshed-cookie',
        },
      ],
      cacheControlHeaders
    )

    expect(response.cookies.get('sb-session')?.value).toBe('refreshed-cookie')
    expect(request.cookies.get('sb-session')?.value).toBe('refreshed-cookie')
    expect(response.headers.get('cache-control')).toBe(
      cacheControlHeaders['Cache-Control']
    )
    expect(response.headers.get('location')).toBeNull()
  })

  test.each([
    {
      name: 'anonymous user',
      result: { data: { user: null }, error: null },
    },
    {
      name: 'unconfirmed user',
      result: {
        data: {
          user: createAuthUser({
            email: 'pending@example.com',
            email_confirmed_at: undefined,
            id: 'user-pending',
          }),
        },
        error: null,
      },
    },
    {
      name: 'auth error',
      result: {
        data: { user: null },
        error: new Error('invalid auth cookie'),
      },
    },
  ])('redirects $name to the public root', async ({ result }) => {
    const getUser = mockGetUserResult(result)
    const request = new NextRequest(
      'https://app.lunav.vn/account?returnTo=%2Faccount&token=secret'
    )

    const response = await proxy(request)

    expect(getUser).toHaveBeenCalledOnce()
    expect(response.headers.get('location')).toBe('https://app.lunav.vn/')
  })

  test('preserves refreshed cookies when redirecting an anonymous user', async () => {
    createServerClientMock.mockImplementation(
      (
        _url: string,
        _publishableKey: string,
        options: {
          cookies: {
            setAll: (
              cookies: ProxyCookieBatch,
              headers: Record<string, string>
            ) => void
          }
        }
      ) => ({
        auth: {
          getUser: vi.fn().mockImplementation(async () => {
            options.cookies.setAll(
              [
                {
                  name: 'sb-session',
                  options: { httpOnly: true, path: '/' },
                  value: 'refreshed-cookie',
                },
              ],
              cacheControlHeaders
            )

            return { data: { user: null }, error: null }
          }),
        },
      })
    )

    const response = await proxy(
      new NextRequest('https://app.lunav.vn/account')
    )

    expect(response.headers.get('location')).toBe('https://app.lunav.vn/')
    expect(response.cookies.get('sb-session')?.value).toBe('refreshed-cookie')
    expect(response.headers.get('cache-control')).toBe(
      cacheControlHeaders['Cache-Control']
    )
  })

  test('redirects safely when verified-user lookup rejects', async () => {
    createServerClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn().mockRejectedValue(new Error('auth unavailable')),
      },
    })

    const response = await proxy(
      new NextRequest(
        'https://app.lunav.vn/account?returnTo=%2Faccount&token=secret'
      )
    )

    expect(response.headers.get('location')).toBe('https://app.lunav.vn/')
  })

  test('passes through an authenticated confirmed user', async () => {
    mockGetUserResult({
      data: {
        user: createAuthUser({
          email: 'confirmed@example.com',
          email_confirmed_at: '2026-07-11T00:00:00.000Z',
          id: 'user-confirmed',
        }),
      },
      error: null,
    })

    const response = await proxy(
      new NextRequest('https://app.lunav.vn/account/settings')
    )

    expect(response.headers.get('location')).toBeNull()
  })
})