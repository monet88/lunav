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

  test('puts signup password-confirmation mismatch on passwordConfirmation', () => {
    try {
      parseSignUpInput({
        email: 'user@example.com',
        password: 'secret12',
        passwordConfirmation: 'different12',
      })
      throw new Error('expected parseSignUpInput to throw')
    } catch (error) {
      expect(error).toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ['passwordConfirmation'] }),
        ]),
      })
    }
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

  test('puts reset password-confirmation mismatch on passwordConfirmation', () => {
    try {
      parseResetPasswordInput({
        password: 'new-password',
        passwordConfirmation: 'different-password',
      })
      throw new Error('expected parseResetPasswordInput to throw')
    } catch (error) {
      expect(error).toMatchObject({
        issues: expect.arrayContaining([
          expect.objectContaining({ path: ['passwordConfirmation'] }),
        ]),
      })
    }
  })
})