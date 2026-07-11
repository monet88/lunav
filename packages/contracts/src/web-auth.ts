import { z } from 'zod'

const emailSchema = z.string().trim().email()
const passwordSchema = z.string().min(8)

const signInSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict()

const signUpSchema = signInSchema
  .extend({
    passwordConfirmation: passwordSchema,
  })
  .refine(
    ({ password, passwordConfirmation }) =>
      password === passwordConfirmation,
    { path: ['passwordConfirmation'] }
  )

const forgotPasswordSchema = z.object({ email: emailSchema }).strict()

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: passwordSchema,
  })
  .strict()
  .refine(
    ({ password, passwordConfirmation }) =>
      password === passwordConfirmation,
    { path: ['passwordConfirmation'] }
  )

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export function parseSignInInput(input: unknown): SignInInput {
  return signInSchema.parse(input)
}

export function parseSignUpInput(input: unknown): SignUpInput {
  return signUpSchema.parse(input)
}

export function parseForgotPasswordInput(input: unknown): ForgotPasswordInput {
  return forgotPasswordSchema.parse(input)
}

export function parseResetPasswordInput(input: unknown): ResetPasswordInput {
  return resetPasswordSchema.parse(input)
}