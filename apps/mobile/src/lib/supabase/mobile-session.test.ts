import type { AuthState } from '@lunav/contracts'
import AsyncStorage from '@react-native-async-storage/async-storage'
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

jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
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
  let appStateCallback: (state: MobileAppState['currentState']) => void = () =>
    undefined
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
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve()
  }
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
          lock: expect.any(Function),
          persistSession: true,
          storage: {
            getItem: expect.any(Function),
            removeItem: expect.any(Function),
            setItem: expect.any(Function),
          },
        },
      }
    )
  })

  test('keeps large session payloads out of SecureStore values', async () => {
    const createClient = jest.fn()

    createMobileSupabaseClient(
      {
        url: 'https://project.supabase.co',
        publishableKey: 'sb_publishable_public',
      },
      { createClient }
    )

    const options = createClient.mock.calls[0]?.[2] as {
      auth: {
        storage: { setItem: (key: string, value: string) => Promise<void> }
      }
    }

    await options.auth.storage.setItem('supabase-session', 'x'.repeat(4096))

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'supabase-session',
      expect.not.stringContaining('x'.repeat(2048))
    )
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'supabase-session',
      expect.any(String)
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

  test('normalizes an unconfirmed user with missing confirmation timestamp', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    auth.getUser.mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-unconfirmed',
          email: 'pending@example.com',
        },
      },
      error: null,
    })
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })

    await controller.start()

    expect(controller.getState()).toEqual({
      status: 'unconfirmed',
      identity: {
        userId: 'user-unconfirmed',
        email: 'pending@example.com',
        isEmailConfirmed: false,
      },
    })
  })

  test('keeps the current state when user refresh fails during startup', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    auth.getUser.mockRejectedValueOnce(new Error('network unavailable'))
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })

    await controller.start()

    expect(controller.getState()).toEqual({ status: 'loading' })
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

  test('only the latest AppState transition controls auto-refresh mode', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness('active')
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const delayedStop = createDeferred<void>()
    const callOrder: string[] = []
    auth.stopAutoRefresh.mockImplementationOnce(async () => {
      callOrder.push('stop-start')
      await delayedStop.promise
      callOrder.push('stop-done')
    })
    auth.startAutoRefresh.mockImplementation(async () => {
      callOrder.push('start')
    })

    await controller.start()
    auth.startAutoRefresh.mockClear()
    callOrder.length = 0

    appState.emitAppState('background')
    await flushAsyncWork()
    appState.emitAppState('active')
    delayedStop.resolve()
    await flushAsyncWork()

    expect(callOrder).toEqual(['stop-start', 'stop-done', 'start'])
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

  test('retains private state until ordered sign-out cleanup succeeds', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const delayedCleanup = createDeferred<void>()
    const observedStates: AuthState[] = []
    const cleanup: SignOutCleanup = {
      cancelUserRequests: jest.fn(async () => delayedCleanup.promise),
      clearUserCacheAndRealtime: jest.fn(async () => undefined),
    }

    controller.subscribe((state) => observedStates.push(state))
    await controller.start()
    observedStates.length = 0
    const signOut = controller.signOut(cleanup)

    expect(controller.getState()).toEqual({
      status: 'authenticated',
      identity: {
        email: 'a@example.com',
        isEmailConfirmed: true,
        userId: 'user-a',
      },
    })
    expect(observedStates).toEqual([])

    delayedCleanup.resolve()
    await signOut

    expect(controller.getState()).toEqual({ status: 'anonymous' })
    expect(observedStates).toEqual([{ status: 'anonymous' }])
  })

  test('ignores auth events while local sign-out cleanup is pending', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const delayedCleanup = createDeferred<void>()
    const cleanup: SignOutCleanup = {
      cancelUserRequests: jest.fn(async () => delayedCleanup.promise),
      clearUserCacheAndRealtime: jest.fn(async () => undefined),
    }

    await controller.start()
    const signOut = controller.signOut(cleanup)
    auth.emitAuthEvent('USER_UPDATED')
    auth.emitAuthEvent('SIGNED_OUT')
    await flushAsyncWork()

    expect(controller.getState()).toEqual({
      status: 'authenticated',
      identity: {
        email: 'a@example.com',
        isEmailConfirmed: true,
        userId: 'user-a',
      },
    })

    delayedCleanup.resolve()
    await signOut
    expect(controller.getState()).toEqual({ status: 'anonymous' })
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

  test('ignores a stale user lookup from a replaced auth event', async () => {
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
    auth.getUser.mockResolvedValueOnce({
      data: { user: confirmedUser },
      error: null,
    })

    auth.emitAuthEvent('USER_UPDATED')
    auth.emitAuthEvent('TOKEN_REFRESHED')
    delayedUser.resolve({ data: { user: unconfirmedUser }, error: null })
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

  test('retains authenticated state when Supabase sign-out fails', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const observedStates: AuthState[] = []
    const cleanup: SignOutCleanup = {
      cancelUserRequests: jest.fn(async () => undefined),
      clearUserCacheAndRealtime: jest.fn(async () => undefined),
    }
    auth.signOut.mockImplementationOnce(async () => {
      auth.emitAuthEvent('SIGNED_OUT')
      return { error: new Error('network unavailable') }
    })

    controller.subscribe((state) => observedStates.push(state))
    await controller.start()
    observedStates.length = 0

    await expect(controller.signOut(cleanup)).rejects.toThrow(
      'network unavailable'
    )
    expect(controller.getState()).toEqual({
      status: 'authenticated',
      identity: {
        email: 'a@example.com',
        isEmailConfirmed: true,
        userId: 'user-a',
      },
    })
    expect(observedStates).toEqual([])
  })

  test('publishes anonymous once after a synchronous successful sign-out event', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const observedStates: AuthState[] = []
    const delayedSignOut = createDeferred<{ error: null }>()
    const cleanup: SignOutCleanup = {
      cancelUserRequests: jest.fn(async () => undefined),
      clearUserCacheAndRealtime: jest.fn(async () => undefined),
    }
    auth.signOut.mockImplementationOnce(async () => {
      auth.emitAuthEvent('SIGNED_OUT')
      return delayedSignOut.promise
    })

    controller.subscribe((state) => observedStates.push(state))
    await controller.start()
    observedStates.length = 0
    const signOut = controller.signOut(cleanup)
    await flushAsyncWork()

    expect(controller.getState()).toEqual({
      status: 'authenticated',
      identity: {
        email: 'a@example.com',
        isEmailConfirmed: true,
        userId: 'user-a',
      },
    })
    expect(observedStates).toEqual([])

    delayedSignOut.resolve({ error: null })
    await signOut

    expect(controller.getState()).toEqual({ status: 'anonymous' })
    expect(observedStates).toEqual([{ status: 'anonymous' }])
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
    auth.startAutoRefresh.mockRejectedValueOnce(
      new Error('refresh unavailable')
    )

    await expect(controller.start()).rejects.toThrow('refresh unavailable')
    await expect(controller.start()).resolves.toBeUndefined()

    expect(auth.unsubscribeAuth).toHaveBeenCalledTimes(1)
    expect(appState.removeAppStateListener).toHaveBeenCalledTimes(1)
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(2)
  })

  test('can start again after subscription setup fails', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness()
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const setupError = new Error('subscription unavailable')
    const onAuthStateChange = auth.client.auth.onAuthStateChange as jest.Mock
    onAuthStateChange.mockImplementationOnce(() => {
      throw setupError
    })

    await expect(controller.start()).rejects.toThrow('subscription unavailable')
    await expect(controller.start()).resolves.toBeUndefined()
  })

  test('duplicate start while running is a no-op for network work', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness('active')
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })

    await controller.start()
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1)
    expect(auth.getUser).toHaveBeenCalledTimes(1)
    expect(auth.client.auth.onAuthStateChange).toHaveBeenCalledTimes(1)

    await controller.start()
    await flushAsyncWork()

    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1)
    expect(auth.getUser).toHaveBeenCalledTimes(1)
    expect(auth.client.auth.onAuthStateChange).toHaveBeenCalledTimes(1)
  })

  test('cancels an in-flight start immediately so stalled getUser cannot delay teardown', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness('active')
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const delayedUser = createDeferred<{
      data: { user: typeof confirmedUser }
      error: null
    }>()
    auth.getUser.mockReturnValueOnce(delayedUser.promise)

    const startPromise = controller.start()
    // Let start attach subscriptions and reach the stalled getUser await.
    await flushAsyncWork()
    expect(auth.client.auth.onAuthStateChange).toHaveBeenCalledTimes(1)

    // Teardown must complete without waiting for getUser to resolve.
    await expect(controller.stop()).resolves.toBeUndefined()
    expect(auth.unsubscribeAuth).toHaveBeenCalledTimes(1)
    expect(appState.removeAppStateListener).toHaveBeenCalledTimes(1)
    expect(auth.stopAutoRefresh).toHaveBeenCalled()

    // Resolving the stalled lookup after stop must not revive auth state.
    delayedUser.resolve({ data: { user: confirmedUser }, error: null })
    await expect(startPromise).resolves.toBeUndefined()
    await flushAsyncWork()

    expect(controller.getState()).toEqual({ status: 'loading' })

    const startCallsAfterTeardown = auth.startAutoRefresh.mock.calls.length
    appState.emitAppState('active')
    await flushAsyncWork()
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(startCallsAfterTeardown)
  })

  test('tears down immediately while startAutoRefresh is still in flight', async () => {
    const auth = createAuthHarness()
    const appState = createAppStateHarness('active')
    const controller = createMobileAuthStateController({
      client: auth.client,
      appState: appState.appState,
    })
    const delayedStartRefresh = createDeferred<void>()
    auth.startAutoRefresh.mockImplementationOnce(async () => {
      await delayedStartRefresh.promise
    })

    const startPromise = controller.start()
    // Reach the blocked startAutoRefresh after subscriptions are attached.
    await flushAsyncWork()
    expect(auth.client.auth.onAuthStateChange).toHaveBeenCalledTimes(1)

    await expect(controller.stop()).resolves.toBeUndefined()
    expect(auth.unsubscribeAuth).toHaveBeenCalledTimes(1)
    expect(appState.removeAppStateListener).toHaveBeenCalledTimes(1)

    delayedStartRefresh.resolve()
    await expect(startPromise).resolves.toBeUndefined()
    await flushAsyncWork()

    // In-flight startAutoRefresh must be countermanded after stop.
    expect(auth.stopAutoRefresh).toHaveBeenCalled()

    const startCallsAfterTeardown = auth.startAutoRefresh.mock.calls.length
    appState.emitAppState('active')
    await flushAsyncWork()
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(startCallsAfterTeardown)
  })
})
