import { describe, expect, test } from 'vitest'
import { withReturnTo } from './return-path'

describe('withReturnTo', () => {
  test('returns the base path when returnTo is empty or the fallback root', () => {
    expect(withReturnTo('/sign-up', '')).toBe('/sign-up')
    expect(withReturnTo('/forgot-password', '/')).toBe('/forgot-password')
  })

  test('appends a validated return destination as a query parameter', () => {
    expect(withReturnTo('/sign-in', '/account')).toBe(
      '/sign-in?returnTo=%2Faccount'
    )
  })
})
