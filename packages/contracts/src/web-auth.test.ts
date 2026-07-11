import { describe, expect, test } from 'vitest'
import {
  parseForgotPasswordInput,
  parseResetPasswordInput,
  parseSignInInput,
  parseSignUpInput,
} from './web-auth.js'

describe('web auth form contracts', () => {
  test('normalizes email without changing the password', () => {
    expect(
      parseSignInInput({
        email: '  USER@example.com  ',
        password: ' pass word ',
      })
    ).toEqual({
      email: 'USER@example.com',
      password: ' pass word ',
    })
  })

  test('requires valid signup fields and matching password confirmation', () => {
    expect(() =>
      parseSignUpInput({
        email: 'not-an-email',
        password: 'secret12',
        passwordConfirmation: 'different12',
      })
    ).toThrow()
  })

  test('rejects non-string form values', () => {
    expect(() =>
      parseForgotPasswordInput({ email: new Blob(['user@example.com']) })
    ).toThrow()
  })

  test('requires matching reset passwords', () => {
    expect(() =>
      parseResetPasswordInput({
        password: 'new-password',
        passwordConfirmation: 'different-password',
      })
    ).toThrow()
  })
})