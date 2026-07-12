import type { AuthState } from '@lunav/contracts'
import { waitForAuthState } from './wait-for-auth-state'
import { canAccessPrivateShell } from './auth-shell'

function createSource(initial: AuthState): {
  source: {
    getState: () => AuthState
    subscribe: (listener: (state: AuthState) => void) => () => void
  }
  emit: (state: AuthState) => void
} {
  let state = initial
  const listeners = new Set<(next: AuthState) => void>()

  return {
    source: {
      getState: () => state,
      subscribe: (listener) => {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
        }
      },
    },
    emit: (next) => {
      state = next
      listeners.forEach((listener) => listener(next))
    },
  }
}

describe('waitForAuthState', () => {
  test('resolves immediately when the current state already matches', async () => {
    const authenticated: AuthState = {
      status: 'authenticated',
      identity: {
        userId: 'user-a',
        email: 'a@example.com',
        isEmailConfirmed: true,
      },
    }
    const { source } = createSource(authenticated)

    await expect(
      waitForAuthState(source, canAccessPrivateShell, { timeoutMs: 100 })
    ).resolves.toEqual(authenticated)
  })

  test('resolves when authenticated is published after subscribe', async () => {
    const { source, emit } = createSource({ status: 'anonymous' })

    const pending = waitForAuthState(source, canAccessPrivateShell, {
      timeoutMs: 500,
    })

    emit({
      status: 'authenticated',
      identity: {
        userId: 'user-a',
        email: 'a@example.com',
        isEmailConfirmed: true,
      },
    })

    await expect(pending).resolves.toMatchObject({ status: 'authenticated' })
  })

  test('resolves when subscribe emits a matching state synchronously', async () => {
    const authenticated: AuthState = {
      status: 'authenticated',
      identity: {
        userId: 'user-sync',
        email: 'sync@example.com',
        isEmailConfirmed: true,
      },
    }

    const source = {
      getState: () => ({ status: 'anonymous' }) as AuthState,
      subscribe: (listener: (state: AuthState) => void) => {
        // Synchronous emission is permitted by AuthStateSource and used to
        // be a TDZ trap for finish() closing over const timer/unsubscribe.
        listener(authenticated)
        return () => undefined
      },
    }

    await expect(
      waitForAuthState(source, canAccessPrivateShell, { timeoutMs: 100 })
    ).resolves.toEqual(authenticated)
  })

  test('rejects on timeout when private shell never opens', async () => {
    const { source } = createSource({ status: 'anonymous' })

    await expect(
      waitForAuthState(source, canAccessPrivateShell, { timeoutMs: 30 })
    ).rejects.toThrow('auth-state-timeout')
  })

  test('does not treat unconfirmed as private-shell ready', async () => {
    const { source, emit } = createSource({ status: 'anonymous' })
    const pending = waitForAuthState(source, canAccessPrivateShell, {
      timeoutMs: 40,
    })

    emit({
      status: 'unconfirmed',
      identity: {
        userId: 'user-b',
        email: 'b@example.com',
        isEmailConfirmed: false,
      },
    })

    await expect(pending).rejects.toThrow('auth-state-timeout')
    expect(canAccessPrivateShell(source.getState())).toBe(false)
  })
})
