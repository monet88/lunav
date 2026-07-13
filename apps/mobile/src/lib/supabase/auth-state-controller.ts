import type { AuthState } from '@lunav/contracts'
import { normalizeAuthState } from '@lunav/contracts'
import { AppState, type AppStateStatus } from 'react-native'

interface AuthSubscription {
  unsubscribe(): void
}

interface AppStateSubscription {
  remove(): void
}

interface AuthUserResult {
  data: {
    user: {
      email?: string
      email_confirmed_at?: string | null
      id?: string
    } | null
  }
  error: unknown | null
}

export interface MobileAuthClient {
  auth: {
    getUser(): Promise<AuthUserResult>
    onAuthStateChange(callback: (event: string) => void): {
      data: { subscription: AuthSubscription }
    }
    signOut(): Promise<{ error: unknown | null }>
    startAutoRefresh(): Promise<void>
    stopAutoRefresh(): Promise<void>
  }
}

export interface MobileAppState {
  currentState: AppStateStatus
  addEventListener(
    event: 'change',
    callback: (state: AppStateStatus) => void
  ): AppStateSubscription
}

export interface SignOutCleanup {
  cancelUserRequests(userId: string): Promise<void>
  clearUserCacheAndRealtime(userId: string): Promise<void>
}

export type AuthStateListener = (state: AuthState) => void

export interface MobileAuthStateController {
  getState(): AuthState
  signOut(cleanup: SignOutCleanup): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  subscribe(listener: AuthStateListener): () => void
}

interface ControllerDependencies {
  appState?: MobileAppState
  client: MobileAuthClient
}

function getUserId(state: AuthState): string | null {
  if (state.status === 'authenticated' || state.status === 'unconfirmed') {
    return state.identity.userId
  }

  return null
}

function normalizeSupabaseUser(
  user: NonNullable<AuthUserResult['data']['user']>
): AuthState {
  return normalizeAuthState({
    email: user.email,
    email_confirmed_at: user.email_confirmed_at ?? null,
    id: user.id,
  })
}

async function runCleanup(operation: () => Promise<void>): Promise<void> {
  try {
    await operation()
  } catch {
    return
  }
}

export function createMobileAuthStateController({
  client,
  appState = AppState,
}: ControllerDependencies): MobileAuthStateController {
  let state: AuthState = { status: 'loading' }
  let isStarted = false
  let isSigningOut = false
  let authGeneration = 0
  // Bumped by stop() and each new start() so an in-flight start can detect
  // cancellation at await yield points without waiting on network I/O.
  let lifecycleRunId = 0
  let autoRefreshQueue = Promise.resolve()
  // Only serializes the short subscription-setup critical section so two starts
  // cannot attach listeners concurrently. Long awaits (getUser / auto-refresh)
  // stay outside this queue so stop() is never blocked by a stalled request.
  let setupQueue: Promise<unknown> = Promise.resolve()
  let authSubscription: AuthSubscription | null = null
  let appStateSubscription: AppStateSubscription | null = null
  const listeners = new Set<AuthStateListener>()

  const enqueueSetup = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = setupQueue.then(operation, operation)
    setupQueue = next.then(
      () => undefined,
      () => undefined
    )
    return next
  }

  const publish = (nextState: AuthState): void => {
    state = nextState
    listeners.forEach((listener) => listener(nextState))
  }

  const refreshStateFromUser = async (): Promise<void> => {
    if (isSigningOut || !isStarted) {
      return
    }

    const generation = authGeneration

    try {
      const result = await client.auth.getUser()

      if (!isStarted || isSigningOut || generation !== authGeneration) {
        return
      }

      if (result.error !== null) {
        return
      }

      if (result.data.user === null) {
        publish({ status: 'anonymous' })
        return
      }

      publish(normalizeSupabaseUser(result.data.user))
    } catch {
      return
    }
  }

  const synchronizeAutoRefresh = async (
    nextAppState: AppStateStatus
  ): Promise<void> => {
    // A delayed queue item must not re-enable refresh after stop().
    if (!isStarted) {
      await client.auth.stopAutoRefresh()
      return
    }

    if (nextAppState === 'active') {
      await client.auth.startAutoRefresh()
      // stop() may have cancelled while startAutoRefresh was in flight.
      if (!isStarted) {
        await client.auth.stopAutoRefresh()
      }
      return
    }

    await client.auth.stopAutoRefresh()
  }

  const queueAutoRefresh = (nextAppState: AppStateStatus): Promise<void> => {
    const operation = autoRefreshQueue
      .catch(() => undefined)
      .then(() => synchronizeAutoRefresh(nextAppState))

    autoRefreshQueue = operation.catch(() => undefined)

    return operation
  }

  const removeSubscriptions = (): void => {
    authSubscription?.unsubscribe()
    appStateSubscription?.remove()
    authSubscription = null
    appStateSubscription = null
  }

  const tearDownStartedController = async (): Promise<void> => {
    isStarted = false
    authGeneration += 1
    removeSubscriptions()
    await client.auth.stopAutoRefresh().catch(() => undefined)
  }

  const start = (): Promise<void> =>
    // Acquire ownership inside setupQueue. Returning null means this call is a
    // no-op (already started / cancelled) so the network phase is skipped.
    enqueueSetup(async (): Promise<number | null> => {
      if (isStarted) {
        return null
      }

      const runId = ++lifecycleRunId
      isStarted = true
      try {
        authSubscription = client.auth.onAuthStateChange((event) => {
          authGeneration += 1

          if (event === 'SIGNED_OUT') {
            // A locally initiated sign-out owns the final state transition. Some
            // clients emit SIGNED_OUT before signOut() reports an error.
            if (!isSigningOut && state.status !== 'anonymous') {
              publish({ status: 'anonymous' })
            }
            return
          }

          void refreshStateFromUser()
        }).data.subscription
        appStateSubscription = appState.addEventListener(
          'change',
          (nextState) => {
            void queueAutoRefresh(nextState).catch(() => undefined)
          }
        )
      } catch (error: unknown) {
        if (runId !== lifecycleRunId) {
          return null
        }

        await tearDownStartedController()
        throw error
      }

      // stop() may have cancelled between isStarted=true and listener attach.
      if (runId !== lifecycleRunId) {
        removeSubscriptions()
        isStarted = false
        return null
      }

      return runId
    }).then(async (runId) => {
      // Long network work stays outside setupQueue so a stalled getUser cannot
      // block stop() or a later remount start().
      if (runId === null || runId !== lifecycleRunId || !isStarted) {
        return
      }

      try {
        await queueAutoRefresh(appState.currentState)

        if (runId !== lifecycleRunId || !isStarted) {
          return
        }

        await refreshStateFromUser()
      } catch (error: unknown) {
        if (runId !== lifecycleRunId) {
          return
        }

        await tearDownStartedController()
        throw error
      }
    })

  const stop = async (): Promise<void> => {
    // Invalidate any in-flight start immediately, drop listeners now, and stop
    // auto-refresh without waiting for getUser() or setupQueue to drain.
    lifecycleRunId += 1
    isStarted = false
    authGeneration += 1
    removeSubscriptions()
    await client.auth.stopAutoRefresh().catch(() => undefined)
  }

  const signOut = async (cleanup: SignOutCleanup): Promise<void> => {
    const userId = getUserId(state)
    let signOutError: unknown | null

    isSigningOut = true
    authGeneration += 1

    try {
      if (userId !== null) {
        await runCleanup(() => cleanup.cancelUserRequests(userId))
        await runCleanup(() => cleanup.clearUserCacheAndRealtime(userId))
      }
    } finally {
      try {
        const result = await client.auth.signOut()
        signOutError = result.error
      } catch (error: unknown) {
        signOutError = error
      } finally {
        isSigningOut = false
      }
    }

    if (signOutError !== null) {
      throw signOutError
    }

    if (state.status !== 'anonymous') {
      publish({ status: 'anonymous' })
    }
  }

  return {
    getState: () => state,
    signOut,
    start,
    stop,
    subscribe: (listener) => {
      listeners.add(listener)

      return () => listeners.delete(listener)
    },
  }
}
