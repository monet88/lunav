import { describe, expect, test } from 'vitest'
import {
  mapCallbackFailure,
  mapConfirmationPendingResult,
  mapForgotPasswordResult,
  mapSignInError,
  mapSignUpResult,
} from './auth-result'

describe('auth provider result mapping', () => {
  test('keeps signup confirmation pending when the provider reports a duplicate account', () => {
    expect(
      mapSignUpResult({
        error: { code: 'email_exists', message: 'User already registered' },
      })
    ).toEqual({
      kind: 'confirmation-pending',
      message: 'Neu dia chi email hop le, ban se nhan duoc huong dan xac nhan.',
    })
  })

  test('maps signup and resend rate limits without claiming email was sent', () => {
    expect(
      mapConfirmationPendingResult({
        error: { code: 'over_email_send_rate_limit', message: 'rate limit' },
      })
    ).toEqual({
      kind: 'error',
      message: 'Ban da thu qua nhieu lan. Vui long thu lai sau it phut.',
    })
  })

  test('keeps password recovery enumeration safe for an unknown account', () => {
    expect(
      mapForgotPasswordResult({
        error: { code: 'user_not_found', message: 'User not found' },
      })
    ).toEqual({
      kind: 'recovery-pending',
      message: 'Neu dia chi email hop le, ban se nhan duoc huong dan dat lai mat khau.',
    })
  })

  test('maps recovery rate limits without claiming email was sent', () => {
    expect(
      mapForgotPasswordResult({
        error: { code: 'over_request_rate_limit', message: 'rate limit' },
      })
    ).toEqual({
      kind: 'error',
      message: 'Ban da thu qua nhieu lan. Vui long thu lai sau it phut.',
    })
  })

  test.each([
    { code: 'invalid_credentials', message: 'Invalid login credentials' },
    { code: 'user_not_found', message: 'User not found' },
    { code: 'email_not_confirmed', message: 'Email not confirmed' },
  ])('maps $code to one safe sign-in message', (error) => {
    expect(mapSignInError(error)).toEqual({
      kind: 'error',
      message: 'Email hoac mat khau khong dung, hoac email chua duoc xac nhan.',
    })
  })

  test('maps rate limits without provider details', () => {
    expect(
      mapSignInError({ code: 'over_request_rate_limit', message: 'rate limit' })
    ).toEqual({
      kind: 'error',
      message: 'Ban da thu qua nhieu lan. Vui long thu lai sau it phut.',
    })
  })

  test('maps unknown callback errors without provider details', () => {
    expect(
      mapCallbackFailure({ code: 'unexpected_failure', message: 'secret trace' })
    ).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
  })
})