import { act, render, waitFor } from '@testing-library/react-native'
import { RecoveryCallbackScreen } from './RecoveryCallbackScreen'
import {
  RECOVERY_SESSION_KEY,
  type RecoverySessionStore,
} from './recovery-session'

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
})
