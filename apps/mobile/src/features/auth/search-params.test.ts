import {
  parseConfirmEmailSearchParams,
  parseConfirmSearchParams,
  parseSignInSearchParams,
} from './search-params'

describe('auth route search params', () => {
  test('collects a single confirm code', () => {
    expect(parseConfirmSearchParams({ code: 'abc' })).toEqual({
      codes: ['abc'],
    })
  })

  test('preserves duplicate confirm codes for fail-closed callback parsing', () => {
    expect(parseConfirmSearchParams({ code: ['one', 'two'] })).toEqual({
      codes: ['one', 'two'],
    })
  })

  test('preserves empty duplicate code values so cardinality stays fail-closed', () => {
    expect(parseConfirmSearchParams({ code: ['valid', ''] })).toEqual({
      codes: ['valid', ''],
    })
    expect(parseConfirmSearchParams({ code: ['', 'valid'] })).toEqual({
      codes: ['', 'valid'],
    })
    expect(parseConfirmSearchParams({ code: '' })).toEqual({
      codes: [''],
    })
  })

  test('fails closed on non-object confirm params', () => {
    expect(parseConfirmSearchParams(null)).toEqual({ codes: [] })
    expect(parseConfirmSearchParams('code=abc')).toEqual({ codes: [] })
  })

  test('only treats a single status=error as confirm-email initial error', () => {
    expect(parseConfirmEmailSearchParams({ status: 'error' })).toEqual({
      initialError: true,
    })
    expect(parseConfirmEmailSearchParams({ status: 'ok' })).toEqual({
      initialError: false,
    })
    expect(
      parseConfirmEmailSearchParams({ status: ['error', 'error'] })
    ).toEqual({ initialError: false })
    expect(parseConfirmEmailSearchParams({ status: ['error', ''] })).toEqual({
      initialError: false,
    })
  })

  test('accepts a single sign-in returnTo string and fails closed otherwise', () => {
    expect(parseSignInSearchParams({ returnTo: '/account' })).toEqual({
      returnTo: '/account',
    })
    expect(parseSignInSearchParams({ returnTo: ['/account', '/other'] })).toEqual({
      returnTo: '',
    })
    expect(parseSignInSearchParams(null)).toEqual({ returnTo: '' })
    expect(parseSignInSearchParams({})).toEqual({ returnTo: '' })
  })
})
