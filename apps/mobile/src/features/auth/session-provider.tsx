import type { AuthState } from '@lunav/contracts'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createMobileAuthStateController,
  type AuthStateListener,
  type MobileAuthStateController,
  type SignOutCleanup,
} from '@/lib/supabase/auth-state-controller'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'
import { stubSignOutCleanup } from './sign-out-cleanup'

export interface MobileAuthSessionValue {
  state: AuthState
  /**
   * Live controller snapshot — preferred over React `state` when waiting for
   * post-sign-in eligibility so submit does not race a stale render.
   */
  getState: () => AuthState
  subscribe: (listener: AuthStateListener) => () => void
  signOut: () => Promise<void>
}

interface MobileAuthSessionProviderProps {
  children: ReactNode
  /**
   * Optional controller for tests. Production uses the US-005 mobile adapter.
   */
  controller?: MobileAuthStateController
  cleanup?: SignOutCleanup
}

const MobileAuthSessionContext = createContext<MobileAuthSessionValue | null>(
  null
)

function createDefaultController(): MobileAuthStateController {
  // Share one Supabase client with signup/callback flows so session storage
  // and auth-state listeners stay on the same adapter instance.
  const client = getSharedMobileSupabaseClient()
  return createMobileAuthStateController({ client })
}

export function MobileAuthSessionProvider({
  children,
  controller: injectedController,
  cleanup = stubSignOutCleanup,
}: MobileAuthSessionProviderProps) {
  // useState lazy init guarantees one controller instance per provider mount.
  // useMemo is not safe here: React may discard memoized values, and recreating
  // the controller would leak Supabase sockets / auth subscriptions.
  const [defaultController] = useState(() =>
    injectedController ? null : createDefaultController()
  )
  const controller = injectedController ?? defaultController!

  const [state, setState] = useState<AuthState>(() => controller.getState())

  useEffect(() => {
    let isActive = true
    setState(controller.getState())
    const unsubscribe = controller.subscribe((nextState) => {
      if (isActive) {
        setState(nextState)
      }
    })

    // Controller stop() cancels an in-flight start synchronously, so cleanup
    // does not wait for getUser()/auto-refresh to finish before tearing down.
    void controller.start().catch(() => {
      // Setup failure tears the controller down with no further auth events.
      // Fall back to public anonymous so boot still resolves without private flash.
      if (isActive) {
        setState({ status: 'anonymous' })
      }
    })

    return () => {
      isActive = false
      unsubscribe()
      void controller.stop().catch(() => undefined)
    }
  }, [controller])

  const signOut = useCallback(async () => {
    await controller.signOut(cleanup)
  }, [cleanup, controller])

  const getState = useCallback(() => controller.getState(), [controller])
  const subscribe = useCallback(
    (listener: AuthStateListener) => controller.subscribe(listener),
    [controller]
  )

  const value = useMemo(
    () => ({
      state,
      getState,
      subscribe,
      signOut,
    }),
    [getState, signOut, state, subscribe]
  )

  return (
    <MobileAuthSessionContext.Provider value={value}>
      {children}
    </MobileAuthSessionContext.Provider>
  )
}

export function useMobileAuthSession(): MobileAuthSessionValue {
  const value = useContext(MobileAuthSessionContext)

  if (value === null) {
    throw new Error(
      'useMobileAuthSession must be used within MobileAuthSessionProvider'
    )
  }

  return value
}

export function useAuthState(): AuthState {
  return useMobileAuthSession().state
}

export function useSignOut(): () => Promise<void> {
  return useMobileAuthSession().signOut
}
