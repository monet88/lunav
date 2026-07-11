import { beforeEach, describe, expect, test, vi } from 'vitest'

const { createBrowserClientMock } = vi.hoisted(() => ({
  createBrowserClientMock: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: createBrowserClientMock,
}))

import { createBrowserSupabaseClient } from './client'

describe('createBrowserSupabaseClient', () => {
  beforeEach(() => {
    createBrowserClientMock.mockReset()
  })

  test('creates a Supabase SSR browser client with public configuration', () => {
    const client = { auth: {} }
    createBrowserClientMock.mockReturnValue(client)

    const result = createBrowserSupabaseClient({
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    })

    expect(createBrowserClientMock).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'publishable-key'
    )
    expect(result).toBe(client)
  })
})