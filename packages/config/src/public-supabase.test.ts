import { describe, expect, test } from 'vitest'
import { parsePublicSupabaseConfig } from './public-supabase.js'

describe('parsePublicSupabaseConfig', () => {
  test('accepts a local Supabase URL and publishable key', () => {
    expect(
      parsePublicSupabaseConfig({
        url: 'http://127.0.0.1:54321',
        publishableKey: 'sb_publishable_example',
      })
    ).toEqual({
      url: 'http://127.0.0.1:54321',
      publishableKey: 'sb_publishable_example',
    })
  })

  test('rejects service-role configuration in a client payload', () => {
    expect(() =>
      parsePublicSupabaseConfig({
        url: 'https://project.supabase.co',
        serviceRoleKey: 'service-role-secret',
      })
    ).toThrow('serviceRoleKey is server-only')
  })
})