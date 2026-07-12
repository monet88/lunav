import {
  resetPasswordWithRecoveryProof,
  type ResetPasswordAuthClient,
} from './reset-password'
import {
  RECOVERY_SESSION_KEY,
  RECOVERY_SESSION_TTL_MS,
  type RecoverySessionStore,
} from './recovery-session'

function createMemoryStore(
  initial?: Record<string, string>
): RecoverySessionStore & { values: Map<string, string> } {
  const values = new Map<string, string>(Object.entries(initial ?? {}))

  return {
    values,
    async getItemAsync(key: string) {
      return values.has(key) ? (values.get(key) as string) : null
    },
    async setItemAsync(key: string, value: string) {
      values.set(key, value)
    },
    async deleteItemAsync(key: string) {
      values.delete(key)
    },
  }
}

function createClient(overrides?: {
  userId?: string
  emailConfirmed?: boolean
  updateError?: { code?: string; message?: string } | null
}): {
  client: ResetPasswordAuthClient
  getUser: jest.Mock
  updateUser: jest.Mock
} {
  const userId = overrides?.userId ?? 'user-1'
  const emailConfirmed = overrides?.emailConfirmed ?? true
  const getUser = jest.fn().mockResolvedValue({
    data: {
      user: {
        id: userId,
        email: 'member@example.com',
        email_confirmed_at: emailConfirmed ? '2026-01-01T00:00:00Z' : null,
      },
    },
    error: null,
  })
  const updateUser = jest.fn().mockResolvedValue({
    error: overrides?.updateError ?? null,
  })

  return {
    client: {
      auth: {
        getUser,
        updateUser,
      },
    },
    getUser,
    updateUser,
  }
}

describe('mobile gated reset-password', () => {
  test('rejects invalid password confirmation without updating', async () => {
    const { client, updateUser } = createClient()
    const store = createMemoryStore()

    const result = await resetPasswordWithRecoveryProof(
      client,
      {
        password: 'password12',
        passwordConfirmation: 'different12',
      },
      store
    )

    expect(result).toEqual({
      kind: 'error',
      message: 'Vui long kiem tra lai thong tin da nhap.',
    })
    expect(updateUser).not.toHaveBeenCalled()
  })

  test('rejects authenticated sessions without a matching recovery proof', async () => {
    const { client, updateUser } = createClient({ userId: 'user-b' })
    const store = createMemoryStore({
      [RECOVERY_SESSION_KEY]: JSON.stringify({
        expiresAt: Date.now() + RECOVERY_SESSION_TTL_MS,
        userId: 'user-a',
      }),
    })

    const result = await resetPasswordWithRecoveryProof(
      client,
      {
        password: 'password12',
        passwordConfirmation: 'password12',
      },
      store
    )

    expect(result).toEqual({
      kind: 'error',
      message: 'Khong the hoan tat yeu cau. Vui long thu lai.',
    })
    expect(updateUser).not.toHaveBeenCalled()
  })

  test('updates password and clears recovery proof when allowed', async () => {
    const { client, updateUser } = createClient({ userId: 'user-1' })
    const store = createMemoryStore({
      [RECOVERY_SESSION_KEY]: JSON.stringify({
        expiresAt: Date.now() + RECOVERY_SESSION_TTL_MS,
        userId: 'user-1',
      }),
    })

    const result = await resetPasswordWithRecoveryProof(
      client,
      {
        password: 'password12',
        passwordConfirmation: 'password12',
      },
      store
    )

    expect(updateUser).toHaveBeenCalledWith({ password: 'password12' })
    expect(result).toEqual({
      kind: 'password-updated',
      message: 'Mat khau da duoc cap nhat.',
    })
    expect(store.values.has(RECOVERY_SESSION_KEY)).toBe(false)
  })

  test('rejects unconfirmed sessions even with a recovery proof', async () => {
    const { client, updateUser } = createClient({
      userId: 'user-1',
      emailConfirmed: false,
    })
    const store = createMemoryStore({
      [RECOVERY_SESSION_KEY]: JSON.stringify({
        expiresAt: Date.now() + RECOVERY_SESSION_TTL_MS,
        userId: 'user-1',
      }),
    })

    const result = await resetPasswordWithRecoveryProof(
      client,
      {
        password: 'password12',
        passwordConfirmation: 'password12',
      },
      store
    )

    expect(result.kind).toBe('error')
    expect(updateUser).not.toHaveBeenCalled()
  })
})
