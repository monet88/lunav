import {
  signInWithEmailPassword,
  type SignInAuthClient,
} from './sign-in'

function createClient(overrides?: {
  signInResult?: { error: { code?: string; message?: string } | null }
}): {
  client: SignInAuthClient
  signInWithPassword: jest.Mock
} {
  const signInWithPassword = jest.fn().mockResolvedValue(
    overrides?.signInResult ?? { error: null }
  )

  return {
    client: {
      auth: {
        signInWithPassword,
      },
    },
    signInWithPassword,
  }
}

describe('mobile sign-in', () => {
  test('rejects invalid form fields without calling Supabase', async () => {
    const { client, signInWithPassword } = createClient()

    const result = await signInWithEmailPassword(client, {
      email: 'not-an-email',
      password: 'short',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Vui long kiem tra lai thong tin da nhap.',
    })
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  test('returns signed-in with the private shell href on success', async () => {
    const { client, signInWithPassword } = createClient()

    const result = await signInWithEmailPassword(
      client,
      {
        email: 'member@example.com',
        password: 'password12',
      },
      '/account'
    )

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'member@example.com',
      password: 'password12',
    })
    expect(result).toEqual({
      kind: 'signed-in',
      href: '/(protected)',
    })
  })

  test('falls back to the private shell when returnTo is unapproved', async () => {
    const { client } = createClient()

    const result = await signInWithEmailPassword(
      client,
      {
        email: 'member@example.com',
        password: 'password12',
      },
      'https://evil.example/phish'
    )

    expect(result).toEqual({
      kind: 'signed-in',
      href: '/(protected)',
    })
  })

  test.each([
    { code: 'invalid_credentials', message: 'Invalid login credentials' },
    { code: 'user_not_found', message: 'User not found' },
    { code: 'email_not_confirmed', message: 'Email not confirmed' },
  ])(
    'maps $code to the shared enumeration-safe sign-in failure message',
    async (error) => {
      const { client, signInWithPassword } = createClient({
        signInResult: { error },
      })

      const result = await signInWithEmailPassword(client, {
        email: 'member@example.com',
        password: 'password12',
      })

      expect(signInWithPassword).toHaveBeenCalled()
      expect(result).toEqual({
        kind: 'error',
        message:
          'Email hoac mat khau khong dung, hoac email chua duoc xac nhan.',
      })
    }
  )

  test('maps rate-limit outcomes to the shared rate-limit message', async () => {
    const { client } = createClient({
      signInResult: {
        error: { code: 'over_request_rate_limit', message: 'rate limit' },
      },
    })

    const result = await signInWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Ban da thu qua nhieu lan. Vui long thu lai sau it phut.',
    })
  })

  test('maps unexpected provider errors without leaking details', async () => {
    const { client } = createClient({
      signInResult: {
        error: { code: 'unexpected_failure', message: 'provider detail' },
      },
    })

    const result = await signInWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
  })

  test('maps transport exceptions as a generic failure, not a form error', async () => {
    const signInWithPassword = jest
      .fn()
      .mockRejectedValue(new Error('network down'))
    const client: SignInAuthClient = {
      auth: { signInWithPassword },
    }

    const result = await signInWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
    expect(signInWithPassword).toHaveBeenCalled()
  })
})
