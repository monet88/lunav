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
  data: { user: unknown | null }
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
  let authSubscription: AuthSubscription | null = null
  let appStateSubscription: AppStateSubscription | null = null
  const listeners = new Set<AuthStateListener>()

  const publish = (nextState: AuthState): void => {
    state = nextState
    listeners.forEach((listener) => listener(nextState))
  }

  const refreshStateFromUser = async (): Promise<void> => {
    if (isSigningOut) {
      return
    }

    const generation = authGeneration

    try {
      const result = await client.auth.getUser()

      if (!isStarted || isSigningOut || generation !== authGeneration) {
        return
      }

      if (result.error !== null || result.data.user === null) {
        publish({ status: 'anonymous' })
        return
      }

      publish(normalizeAuthState(result.data.user))
    } catch {
      if (isStarted && !isSigningOut && generation === authGeneration) {
        publish({ status: 'anonymous' })
      }
    }
  }

  const synchronizeAutoRefresh = async (
    nextAppState: AppStateStatus
  ): Promise<void> => {
    if (nextAppState === 'active') {
      await client.auth.startAutoRefresh()
      return
    }

    await client.auth.stopAutoRefresh()
  }

  const removeSubscriptions = (): void => {
    authSubscription?.unsubscribe()
    appStateSubscription?.remove()
    authSubscription = null
    appStateSubscription = null
  }

  const start = async (): Promise<void> => {
    if (isStarted) {
      return
    }

    isStarted = true
    authSubscription = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        authGeneration += 1
        publish({ status: 'anonymous' })
        return
      }

      void refreshStateFromUser()
    }).data.subscription
    appStateSubscription = appState.addEventListener('change', (nextState) => {
      void synchronizeAutoRefresh(nextState).catch(() => undefined)
    })

    try {
      await synchronizeAutoRefresh(appState.currentState)
      await refreshStateFromUser()
    } catch (error: unknown) {
      isStarted = false
      authGeneration += 1
      removeSubscriptions()
      await client.auth.stopAutoRefresh().catch(() => undefined)
      throw error
    }
  }

  const stop = async (): Promise<void> => {
    if (!isStarted) {
      return
    }

    isStarted = false
    authGeneration += 1
    removeSubscriptions()
    await client.auth.stopAutoRefresh()
  }

  const signOut = async (cleanup: SignOutCleanup): Promise<void> => {
    const userId = getUserId(state)
    let signOutError: unknown | null

    isSigningOut = true
    authGeneration += 1
    publish({ status: 'anonymous' })

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
