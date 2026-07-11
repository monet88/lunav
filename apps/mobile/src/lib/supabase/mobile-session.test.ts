import type { AuthState } from '@lunav/contracts'
import * as SecureStore from 'expo-secure-store'
import { createMobileAuthStateController } from './auth-state-controller'
import type {
  MobileAppState,
  MobileAuthClient,
  SignOutCleanup,
} from './auth-state-controller'
import { createMobileSupabaseClient } from './client'
import { getMobileSupabaseConfig } from './config'

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}))

interface AuthHarness {
  authCallback: (event: string) => void
  client: MobileAuthClient
  emitAuthEvent: (event: string) => void
  getUser: jest.Mock
  signOut: jest.Mock
  startAutoRefresh: jest.Mock
  stopAutoRefresh: jest.Mock
  unsubscribeAuth: jest.Mock
}

interface AppStateHarness {
  appState: MobileAppState
  emitAppState: (state: MobileAppState['currentState']) => void
  removeAppStateListener: jest.Mock
}

const confirmedUser = {
  id: 'user-a',
  email: 'a@example.com',
  email_confirmed_at: '2026-07-11T10:30:00.000Z',
}

const unconfirmedUser = {
  id: 'user-b',
  email: 'b@example.com',
  email_confirmed_at: null,
}

function createAuthHarness(): AuthHarness {
  let authCallback: (event: string) => void = () => undefined
  const unsubscribeAuth = jest.fn()
  const getUser = jest.fn().mockResolvedValue({
    data: { user: confirmedUser },
    error: null,
  })
  const startAutoRefresh = jest.fn().mockResolvedValue(undefined)
  const stopAutoRefresh = jest.fn().mockResolvedValue(undefined)
  const signOut = jest.fn().mockResolvedValue({ error: null })

  const client: MobileAuthClient = {
    auth: {
      getUser,
      onAuthStateChange: jest.fn((callback) => {
        authCallback = callback

        return {
          data: {
            subscription: { unsubscribe: unsubscribeAuth },
          },
        }
      }),
      signOut,
      startAutoRefresh,
      stopAutoRefresh,
    },
  }

  return {
    get authCallback() {
      return authCallback
    },
    client,
    emitAuthEvent: (event) => authCallback(event),
    getUser,
    signOut,
    startAutoRefresh,
    stopAutoRefresh,
    unsubscribeAuth,
  }
}

function createAppStateHarness(
  initialState: MobileAppState['currentState'] = 'active'
): AppStateHarness {
  let appStateCallback: (
    state: MobileAppState['currentState']
  ) => void = () => undefined
  const removeAppStateListener = jest.fn()

  return {
    appState: {
      currentState: initialState,
      addEventListener: jest.fn((_event, callback) => {
        appStateCallback = callback

        return { remove: removeAppStateListener }
      }),
    },
    emitAppState: (state) => appStateCallback(state),
    removeAppStateListener,
  }
}

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

function createDeferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

describe('getMobileSupabaseConfig', () => {
  test('reads and validates the Expo public Supabase variables', () => {
    expect(
      getMobileSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_public',
      })
    ).toEqual({
      url: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_public',
    })
  })

  test('requires the public publishable key', () => {
    expect(() =>
      getMobileSupabaseConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
      })
    ).toThrow()
  })
})

describe('createMobileSupabaseClient', () => {
  test('uses encrypted SecureStore persistence and native-safe auth options', () => {
    const createdClient = { auth: {} }
    const createClient = jest.fn(() => createdClient)

    const result = createMobileSupabaseClient(
      {
        url: 'https://project.supabase.co',
        publishableKey: 'sb_publishable_public',
      },
      { createClient }
    )

    expect(result).toBe(createdClient)
    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'sb_publishable_public',
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: false,
          persistSession: true,
          storage: {
            getItem: SecureStore.getItemAsync,
            removeItem: SecureStore.deleteItemAsync,
            setItem: SecureStore.setItemAsync,
          },
        },
      }
    )
  })
})

describe('mobile auth-state controller', () => {
  test('normalizes getUser and auth-event results without exposing a session', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const observedStates: AuthState[] = []

    controller.subscribe((state) => observedStates.push(state))
    await controller.start()

    expect(controller.getState()).toEqual({
      status: 'authenticated',
      identity: {
        userId: 'user-a',
        email: 'a@example.com',
        isEmailConfirmed: true,
      },
    })

    auth.getUser.mockResolvedValueOnce({
      data: { user: unconfirmedUser },
      error: null,
    })
    auth.emitAuthEvent('USER_UPDATED')
    await flushAsyncWork()

    expect(controller.getState()).toEqual({
      status: 'unconfirmed',
      identity: {
        userId: 'user-b',
        email: 'b@example.com',
        isEmailConfirmed: false,
      },
    })
    expect(observedStates).toEqual([
      {
        status: 'authenticated',
        identity: {
          userId: 'user-a',
          email: 'a@example.com',
          isEmailConfirmed: true,
        },
      },
      {
        status: 'unconfirmed',
        identity: {
          userId: 'user-b',
          email: 'b@example.com',
          isEmailConfirmed: false,
        },
      },
    ])
    expect(Object.keys(controller.getState())).not.toContain('session')
  })

  test('starts refresh only in foreground and tears down both listeners', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness('active')
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })

    await controller.start()
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1)

    appState.emitAppState('background')
    await flushAsyncWork()
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1)

    appState.emitAppState('active')
    await flushAsyncWork()
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(2)

    await controller.stop()

    expect(auth.unsubscribeAuth).toHaveBeenCalledTimes(1)
    expect(appState.removeAppStateListener).toHaveBeenCalledTimes(1)
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(2)
  })

  test('signs out and emits anonymous after ordered user-scoped cleanup failure', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const callOrder: string[] = []
    const observedStates: AuthState[] = []
    const cleanup: SignOutCleanup = {
      cancelUserRequests: jest.fn(async (userId) => {
        callOrder.push(`cancel:${userId}`)
        throw new Error('redacted cleanup failure')
      }),
      clearUserCacheAndRealtime: jest.fn(async (userId) => {
        callOrder.push(`clear:${userId}`)
      }),
    }
    auth.signOut.mockImplementation(async () => {
      callOrder.push('supabase-sign-out')
      return { error: null }
    })

    controller.subscribe((state) => observedStates.push(state))
    await controller.start()
    observedStates.length = 0

    await expect(controller.signOut(cleanup)).resolves.toBeUndefined()

    expect(callOrder).toEqual([
      'cancel:user-a',
      'clear:user-a',
      'supabase-sign-out',
    ])
    expect(cleanup.cancelUserRequests).toHaveBeenCalledWith('user-a')
    expect(cleanup.clearUserCacheAndRealtime).toHaveBeenCalledWith('user-a')
    expect(cleanup.cancelUserRequests).not.toHaveBeenCalledWith('user-b')
    expect(cleanup.clearUserCacheAndRealtime).not.toHaveBeenCalledWith('user-b')
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(controller.getState()).toEqual({ status: 'anonymous' })
    expect(observedStates).toEqual([{ status: 'anonymous' }])
  })

  test('blocks private state before sign-out cleanup begins', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    let releaseCleanup: (() => void) | undefined
    const cleanupStarted = new Promise<void>((resolve) => {
      releaseCleanup = resolve
    })
    const cleanup: SignOutCleanup = {
      cancelUserRequests: jest.fn(async () => cleanupStarted),
      clearUserCacheAndRealtime: jest.fn(async () => undefined),
    }

    await controller.start()
    const signOut = controller.signOut(cleanup)

    expect(controller.getState()).toEqual({ status: 'anonymous' })
    releaseCleanup?.()
    await signOut
  })

  test('does not restore private state from an auth event during sign-out cleanup', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    let releaseCleanup: (() => void) | undefined
    const cleanupStarted = new Promise<void>((resolve) => {
      releaseCleanup = resolve
    })
    const cleanup: SignOutCleanup = {
      cancelUserRequests: jest.fn(async () => cleanupStarted),
      clearUserCacheAndRealtime: jest.fn(async () => undefined),
    }

    await controller.start()
    const signOut = controller.signOut(cleanup)
    auth.emitAuthEvent('USER_UPDATED')
    await flushAsyncWork()

    expect(controller.getState()).toEqual({ status: 'anonymous' })
    releaseCleanup?.()
    await signOut
  })

  test('ignores a stale user lookup that resolves after a sign-out event', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })

    await controller.start()
    const delayedUser = createDeferred<{
      data: { user: typeof unconfirmedUser }
      error: null
    }>()
    auth.getUser.mockReturnValueOnce(delayedUser.promise)

    auth.emitAuthEvent('USER_UPDATED')
    auth.emitAuthEvent('SIGNED_OUT')
    delayedUser.resolve({ data: { user: unconfirmedUser }, error: null })
    await flushAsyncWork()

    expect(controller.getState()).toEqual({ status: 'anonymous' })
  })

  test('ignores a stale user lookup that resolves after the controller stops', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })

    await controller.start()
    const delayedUser = createDeferred<{
      data: { user: typeof confirmedUser }
      error: null
    }>()
    auth.getUser.mockReturnValueOnce(delayedUser.promise)

    auth.emitAuthEvent('USER_UPDATED')
    await controller.stop()
    delayedUser.resolve({ data: { user: confirmedUser }, error: null })
    await flushAsyncWork()

    expect(controller.getState()).toEqual({
      status: 'authenticated',
      identity: {
        email: 'a@example.com',
        isEmailConfirmed: true,
        userId: 'user-a',
      },
    })
  })

  test('can start again after initial refresh setup fails', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    auth.startAutoRefresh.mockRejectedValueOnce(new Error('refresh unavailable'))

    await expect(controller.start()).rejects.toThrow('refresh unavailable')
    await expect(controller.start()).resolves.toBeUndefined()

    expect(auth.unsubscribeAuth).toHaveBeenCalledTimes(1)
    expect(appState.removeAppStateListener).toHaveBeenCalledTimes(1)
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(2)
  })
})
