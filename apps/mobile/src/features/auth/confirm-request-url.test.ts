import { buildConfirmRequestUrl } from '@/features/auth/confirm-request-url'

describe('buildConfirmRequestUrl', () => {
  test('returns null when no codes are present', () => {
    expect(buildConfirmRequestUrl([])).toBeNull()
  })

  test('builds a single-code local confirm deep link', () => {
    expect(buildConfirmRequestUrl(['abc123'])).toBe(
      'lunav://auth/confirm?code=abc123'
    )
  })

  test('preserves duplicate codes so the callback can reject them', () => {
    expect(buildConfirmRequestUrl(['one', 'two'])).toBe(
      'lunav://auth/confirm?code=one&code=two'
    )
  })
})
