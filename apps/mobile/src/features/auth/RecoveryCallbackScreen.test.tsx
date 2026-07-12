import { act, cleanup, render, waitFor } from '@testing-library/react-native'
import { clearAuthCallbackWorkCacheForTests } from './auth-callback-work'
import { RecoveryCallbackScreen } from './RecoveryCallbackScreen'
import {
  RECOVERY_SESSION_KEY,
  type RecoverySessionStore,
} from './recovery-session'

beforeEach(() => {
  clearAuthCallbackWorkCacheForTests()
})

function createClient(result: {
  data: { redirectType: string | null; user?: { id: string } | null }
  error: { code: string } | null
}) {
  return {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue(result),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  }
}

function createMemoryStore(): RecoverySessionStore & {
  values: Map<string, string>
} {
  const values = new Map<string, string>()

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

describe('RecoveryCallbackScreen', () => {
  test('stores recovery proof and replaces to reset-password after a valid exchange', async () => {
    const client = createClient({
      data: { redirectType: 'recovery', user: { id: 'user-recovery' } },
      error: null,
    })
    const replace = jest.fn()
    const store = createMemoryStore()

    await act(async () => {
      render(
        <RecoveryCallbackScreen
          client={client}
          navigation={{ replace }}
          recoveryStore={store}
          requestUrl="lunav://auth/recovery?code=valid-code"
          successPath="/auth/reset-password"
        />
      )
    })

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/reset-password')
    })
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledWith(
      'valid-code'
    )
    expect(store.values.has(RECOVERY_SESSION_KEY)).toBe(true)
    expect(JSON.parse(store.values.get(RECOVERY_SESSION_KEY) as string)).toEqual(
      expect.objectContaining({ userId: 'user-recovery' })
    )
  })

  test('replaces navigation with the failure path when the code is missing', async () => {
    const client = createClient({
      data: { redirectType: 'recovery', user: { id: 'user-1' } },
      error: null,
    })
    const replace = jest.fn()
    const store = createMemoryStore()

    await act(async () => {
      render(
        <RecoveryCallbackScreen
          client={client}
          navigation={{ replace }}
          recoveryStore={store}
          requestUrl={null}
        />
      )
    })

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/recovery-failed')
    })
    expect(client.auth.exchangeCodeForSession).not.toHaveBeenCalled()
    expect(store.values.has(RECOVERY_SESSION_KEY)).toBe(false)
  })

  test('fails closed for confirmation codes on the recovery route and still replaces history', async () => {
    const client = createClient({
      data: { redirectType: null, user: { id: 'user-1' } },
      error: null,
    })
    const replace = jest.fn()
    const store = createMemoryStore()

    await act(async () => {
      render(
        <RecoveryCallbackScreen
          client={client}
          navigation={{ replace }}
          recoveryStore={store}
          requestUrl="lunav://auth/recovery?code=confirm-code"
        />
      )
    })

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/recovery-failed')
    })
    expect(client.auth.signOut).toHaveBeenCalledTimes(1)
    expect(store.values.has(RECOVERY_SESSION_KEY)).toBe(false)
  })

  test('exchanges once across StrictMode remount and still replaces on the active mount', async () => {
    const client = createClient({
      data: { redirectType: 'recovery', user: { id: 'user-recovery' } },
      error: null,
    })
    const replace = jest.fn()
    const store = createMemoryStore()
    let resolveExchange:
      | ((value: {
          data: { redirectType: string | null; user?: { id: string } | null }
          error: { code: string } | null
        }) => void)
      | undefined

    client.auth.exchangeCodeForSession = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveExchange = resolve
        })
    )

    await act(async () => {
      render(
        <RecoveryCallbackScreen
          client={client}
          navigation={{ replace }}
          recoveryStore={store}
          requestUrl="lunav://auth/recovery?code=valid-code"
          successPath="/auth/reset-password"
        />
      )
    })

    // Simulate React 18 StrictMode: unmount then remount before the exchange resolves.
    await act(async () => {
      cleanup()
    })
    await act(async () => {
      render(
        <RecoveryCallbackScreen
          client={client}
          navigation={{ replace }}
          recoveryStore={store}
          requestUrl="lunav://auth/recovery?code=valid-code"
          successPath="/auth/reset-password"
        />
      )
    })

    await act(async () => {
      resolveExchange?.({
        data: { redirectType: 'recovery', user: { id: 'user-recovery' } },
        error: null,
      })
    })

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/reset-password')
    })
    expect(client.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1)
    expect(store.values.has(RECOVERY_SESSION_KEY)).toBe(true)
  })

  test('replaces to failure when SecureStore proof write throws', async () => {
    const client = createClient({
      data: { redirectType: 'recovery', user: { id: 'user-recovery' } },
      error: null,
    })
    const replace = jest.fn()
    const store: RecoverySessionStore = {
      async getItemAsync() {
        return null
      },
      async setItemAsync() {
        throw new Error('secure store unavailable')
      },
      async deleteItemAsync() {},
    }

    await act(async () => {
      render(
        <RecoveryCallbackScreen
          client={client}
          navigation={{ replace }}
          recoveryStore={store}
          requestUrl="lunav://auth/recovery?code=valid-code"
        />
      )
    })

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/auth/recovery-failed')
    })
  })
})
