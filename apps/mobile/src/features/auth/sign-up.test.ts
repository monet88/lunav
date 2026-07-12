import {
  resendSignupConfirmation,
  signUpWithEmailPassword,
  type SignUpAuthClient,
} from './sign-up'

function createClient(overrides?: {
  signUpResult?: { error: { code?: string; message?: string } | null }
  resendResult?: { error: { code?: string; message?: string } | null }
}): {
  client: SignUpAuthClient
  signUp: jest.Mock
  resend: jest.Mock
} {
  const signUp = jest.fn().mockResolvedValue(
    overrides?.signUpResult ?? { error: null }
  )
  const resend = jest.fn().mockResolvedValue(
    overrides?.resendResult ?? { error: null }
  )

  return {
    client: {
      auth: {
        signUp,
        resend,
      },
    },
    signUp,
    resend,
  }
}

describe('mobile sign-up and resend', () => {
  test('rejects invalid form fields without calling Supabase', async () => {
    const { client, signUp } = createClient()

    const result = await signUpWithEmailPassword(client, {
      email: 'not-an-email',
      password: 'secret12',
      passwordConfirmation: 'different12',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Vui long kiem tra lai thong tin da nhap.',
    })
    expect(signUp).not.toHaveBeenCalled()
  })

  test('uses the local confirm deep link and returns enumeration-safe pending copy', async () => {
    const { client, signUp } = createClient({
      signUpResult: {
        error: { code: 'email_exists', message: 'provider detail' },
      },
    })

    const result = await signUpWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
      passwordConfirmation: 'password12',
    })

    expect(signUp).toHaveBeenCalledWith({
      email: 'member@example.com',
      password: 'password12',
      options: { emailRedirectTo: 'lunav://auth/confirm' },
    })
    expect(result).toEqual({
      kind: 'confirmation-pending',
      message: 'Neu dia chi email hop le, ban se nhan duoc huong dan xac nhan.',
    })
  })

  test('maps rate-limit signup outcomes to the shared rate-limit message', async () => {
    const { client } = createClient({
      signUpResult: {
        error: { code: 'over_email_send_rate_limit', message: 'rate limit' },
      },
    })

    const result = await signUpWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
      passwordConfirmation: 'password12',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Ban da thu qua nhieu lan. Vui long thu lai sau it phut.',
    })
  })

  test('maps unexpected signup provider errors without claiming email was sent', async () => {
    const { client } = createClient({
      signUpResult: {
        error: { code: 'unexpected_failure', message: 'provider detail' },
      },
    })

    const result = await signUpWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
      passwordConfirmation: 'password12',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
  })

  test('maps transport exceptions as a generic failure, not a form error', async () => {
    const signUp = jest.fn().mockRejectedValue(new Error('network down'))
    const client: SignUpAuthClient = {
      auth: {
        signUp,
        resend: jest.fn(),
      },
    }

    const result = await signUpWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
      passwordConfirmation: 'password12',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
    expect(signUp).toHaveBeenCalled()
  })

  test('resend confirmation keeps the same safe pending messaging', async () => {
    const { client, resend } = createClient({
      resendResult: {
        error: { code: 'user_not_found', message: 'provider detail' },
      },
    })

    const result = await resendSignupConfirmation(
      client,
      'member@example.com'
    )

    expect(resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'member@example.com',
      options: { emailRedirectTo: 'lunav://auth/confirm' },
    })
    expect(result).toEqual({
      kind: 'confirmation-pending',
      message: 'Neu dia chi email hop le, ban se nhan duoc huong dan xac nhan.',
    })
  })

  test('resend rate limits surface the shared rate-limit message', async () => {
    const { client } = createClient({
      resendResult: {
        error: { code: 'over_request_rate_limit', message: 'rate limit' },
      },
    })

    const result = await resendSignupConfirmation(
      client,
      'member@example.com'
    )

    expect(result).toEqual({
      kind: 'error',
      message: 'Ban da thu qua nhieu lan. Vui long thu lai sau it phut.',
    })
  })

  test('maps resend transport exceptions as a generic failure, not a form error', async () => {
    const resend = jest.fn().mockRejectedValue(new Error('network down'))
    const client: SignUpAuthClient = {
      auth: {
        signUp: jest.fn(),
        resend,
      },
    }

    const result = await resendSignupConfirmation(
      client,
      'member@example.com'
    )

    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
    expect(resend).toHaveBeenCalled()
  })
})
