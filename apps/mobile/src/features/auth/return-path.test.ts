import { parseAuthReturnDestination } from '@lunav/contracts'
import { resolveMobileSignInHref } from './return-path'

describe('mobile sign-in return destination', () => {
  test('maps the canonical account path to the private shell entry', () => {
    expect(parseAuthReturnDestination('/account')).toBe('/account')
    expect(resolveMobileSignInHref('/account')).toBe('/(protected)')
  })

  test('falls back safely for empty or root return destinations', () => {
    expect(parseAuthReturnDestination('')).toBe('/')
    expect(resolveMobileSignInHref(undefined)).toBe('/(protected)')
    expect(resolveMobileSignInHref('')).toBe('/(protected)')
    expect(resolveMobileSignInHref('/')).toBe('/(protected)')
  })

  test.each([
    'https://evil.example/account',
    'javascript:alert(1)',
    '//evil.example/account',
    '/account?tab=security',
    '/sign-up',
    '/\\account',
  ])('rejects unapproved destination %j without leaving the private shell', (raw) => {
    expect(parseAuthReturnDestination(raw)).toBe('/')
    expect(resolveMobileSignInHref(raw)).toBe('/(protected)')
  })
})
