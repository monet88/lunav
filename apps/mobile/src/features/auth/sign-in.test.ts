import {
  signInWithEmailPassword,
  type SignInAuthClient,
} from './sign-in'

const confirmedUser = {
  id: 'user-a',
  email: 'member@example.com',
  email_confirmed_at: '2026-07-11T10:30:00.000Z',
}

const unconfirmedUser = {
  id: 'user-b',
  email: 'member@example.com',
  email_confirmed_at: null,
}

function createClient(overrides?: {
  signInResult?: { error: { code?: string; message?: string } | null }
  getUserResult?: {
    data: { user: typeof confirmedUser | typeof unconfirmedUser | null }
    error: unknown | null
  }
  getUserImpl?: jest.Mock
}): {
  client: SignInAuthClient
  getUser: jest.Mock
  signInWithPassword: jest.Mock
} {
  const signInWithPassword = jest.fn().mockResolvedValue(
    overrides?.signInResult ?? { error: null }
  )
  const getUser =
    overrides?.getUserImpl ??
    jest.fn().mockResolvedValue(
      overrides?.getUserResult ?? {
        data: { user: confirmedUser },
        error: null,
      }
    )

  return {
    client: {
      auth: {
        signInWithPassword,
        getUser,
      },
    },
    getUser,
    signInWithPassword,
  }
}

describe('mobile sign-in', () => {
  test('rejects invalid form fields without calling Supabase', async () => {
    const { client, getUser, signInWithPassword } = createClient()

    const result = await signInWithEmailPassword(client, {
      email: 'not-an-email',
      password: 'short',
    })

    expect(result).toEqual({
      kind: 'error',
      message: 'Vui long kiem tra lai thong tin da nhap.',
    })
    expect(signInWithPassword).not.toHaveBeenCalled()
    expect(getUser).not.toHaveBeenCalled()
  })

  test('returns signed-in with the private shell href only after identity is authenticated', async () => {
    const { client, getUser, signInWithPassword } = createClient()

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
    expect(getUser).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      kind: 'signed-in',
      href: '/(protected)/account',
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

  test('does not claim signed-in when password succeeds but getUser rejects', async () => {
    const getUser = jest.fn().mockRejectedValue(new Error('network down'))
    const { client, signInWithPassword } = createClient({ getUserImpl: getUser })

    const result = await signInWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
    })

    expect(signInWithPassword).toHaveBeenCalled()
    expect(getUser).toHaveBeenCalled()
    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
  })

  test('does not claim signed-in when password succeeds but getUser returns an error', async () => {
    const { client, getUser } = createClient({
      getUserResult: {
        data: { user: null },
        error: { message: 'token invalid' },
      },
    })

    const result = await signInWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
    })

    expect(getUser).toHaveBeenCalled()
    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
  })

  test('maps unconfirmed identity after password success to the shared sign-in failure message', async () => {
    const { client, getUser } = createClient({
      getUserResult: {
        data: { user: unconfirmedUser },
        error: null,
      },
    })

    const result = await signInWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
    })

    expect(getUser).toHaveBeenCalled()
    expect(result).toEqual({
      kind: 'error',
      message: 'Email hoac mat khau khong dung, hoac email chua duoc xac nhan.',
    })
  })

  test('does not navigate when getUser is delayed past password success', async () => {
    let resolveGetUser!: (value: {
      data: { user: typeof confirmedUser }
      error: null
    }) => void
    const getUser = jest.fn(
      () =>
        new Promise<{
          data: { user: typeof confirmedUser }
          error: null
        }>((resolve) => {
          resolveGetUser = resolve
        })
    )
    const { client, signInWithPassword } = createClient({ getUserImpl: getUser })

    const pending = signInWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
    })

    // Password resolved; identity still open — must not have signed-in yet.
    await Promise.resolve()
    expect(signInWithPassword).toHaveBeenCalled()
    expect(getUser).toHaveBeenCalled()

    resolveGetUser({ data: { user: confirmedUser }, error: null })
    await expect(pending).resolves.toEqual({
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
      const { client, getUser, signInWithPassword } = createClient({
        signInResult: { error },
      })

      const result = await signInWithEmailPassword(client, {
        email: 'member@example.com',
        password: 'password12',
      })

      expect(signInWithPassword).toHaveBeenCalled()
      expect(getUser).not.toHaveBeenCalled()
      expect(result).toEqual({
        kind: 'error',
        message:
          'Email hoac mat khau khong dung, hoac email chua duoc xac nhan.',
      })
    }
  )

  test('maps rate-limit outcomes to the shared rate-limit message', async () => {
    const { client, getUser } = createClient({
      signInResult: {
        error: { code: 'over_request_rate_limit', message: 'rate limit' },
      },
    })

    const result = await signInWithEmailPassword(client, {
      email: 'member@example.com',
      password: 'password12',
    })

    expect(getUser).not.toHaveBeenCalled()
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
    const getUser = jest.fn()
    const client: SignInAuthClient = {
      auth: { signInWithPassword, getUser },
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
    expect(getUser).not.toHaveBeenCalled()
  })
})
