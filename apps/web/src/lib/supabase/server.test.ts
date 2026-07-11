import type { User } from '@supabase/supabase-js'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { cookiesMock, createServerClientMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  createServerClientMock: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: createServerClientMock,
}))

import {
  createServerSupabaseClient,
  resolveCurrentAuthState,
} from './server'

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

describe('createServerSupabaseClient', () => {
  beforeEach(() => {
    cookiesMock.mockReset()
    createServerClientMock.mockReset()
  })

  test('wires read-only Next cookies into the Supabase server client', async () => {
    const cookieStore = {
      getAll: vi.fn().mockReturnValue([
        { name: 'sb-session', value: 'existing-cookie' },
      ]),
    }
    const client = { auth: { getUser: vi.fn() } }
    cookiesMock.mockResolvedValue(cookieStore)
    createServerClientMock.mockReturnValue(client)

    const result = await createServerSupabaseClient({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    })

    expect(result).toBe(client)
    expect(createServerClientMock).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'publishable-key',
      expect.objectContaining({
        cookies: {
          getAll: expect.any(Function),
        },
      })
    )

    const options = createServerClientMock.mock.calls[0]?.[2] as {
      cookies: {
        getAll: () => Array<{ name: string; value: string }>
      }
    }

    expect(options.cookies.getAll()).toEqual([
      { name: 'sb-session', value: 'existing-cookie' },
    ])

    expect(options.cookies).not.toHaveProperty('setAll')
  })
})

describe('resolveCurrentAuthState', () => {
  test('normalizes a validated confirmed user to authenticated state', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: {
        user: createAuthUser({
          email: 'confirmed@example.com',
          email_confirmed_at: '2026-07-11T00:00:00.000Z',
          id: 'user-confirmed',
        }),
      },
      error: null,
    })

    const state = await resolveCurrentAuthState({ auth: { getUser } })

    expect(getUser).toHaveBeenCalledOnce()
    expect(state).toEqual({
      identity: {
        email: 'confirmed@example.com',
        isEmailConfirmed: true,
        userId: 'user-confirmed',
      },
      status: 'authenticated',
    })
  })

  test('normalizes a validated unconfirmed user to unconfirmed state', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: {
        user: createAuthUser({
          email: 'pending@example.com',
          email_confirmed_at: undefined,
          id: 'user-pending',
        }),
      },
      error: null,
    })

    const state = await resolveCurrentAuthState({ auth: { getUser } })

    expect(state.status).toBe('unconfirmed')
  })

  test.each([
    {
      name: 'anonymous Supabase result',
      result: { data: { user: null }, error: null },
    },
    {
      name: 'Supabase auth error',
      result: {
        data: { user: null },
        error: new Error('invalid auth cookie'),
      },
    },
    {
      name: 'invalid verified user shape',
      result: {
        data: {
          user: createAuthUser({ email: undefined, id: 'invalid-user' }),
        },
        error: null,
      },
    },
  ])('resolves anonymous for $name', async ({ result }) => {
    const state = await resolveCurrentAuthState({
      auth: { getUser: vi.fn().mockResolvedValue(result) },
    })

    expect(state).toEqual({ status: 'anonymous' })
  })
})