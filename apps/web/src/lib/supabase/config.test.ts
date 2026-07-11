import { describe, expect, test } from 'vitest'
import { getWebSupabaseConfig } from './config'

describe('getWebSupabaseConfig', () => {
  test('returns validated public Supabase configuration', () => {
    expect(
      getWebSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      })
    ).toEqual({
      publishableKey: 'publishable-key',
      url: 'https://project.supabase.co',
    })
  })

  test('requires the public publishable key', () => {
    expect(() =>
      getWebSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      })
    ).toThrow()
  })
})