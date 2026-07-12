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
  type MobileAuthStateController,
  type SignOutCleanup,
} from '@/lib/supabase/auth-state-controller'
import { createMobileSupabaseClient } from '@/lib/supabase/client'
import { getMobileSupabaseConfig } from '@/lib/supabase/config'
import { stubSignOutCleanup } from './sign-out-cleanup'

export interface MobileAuthSessionValue {
  state: AuthState
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
  const client = createMobileSupabaseClient(getMobileSupabaseConfig())
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

    // Keep start/stop ordered for this effect generation so a Strict Mode
    // remount cannot interleave stop() with an in-flight start().
    const startPromise = controller.start().catch(() => {
      // Setup failure tears the controller down with no further auth events.
      // Fall back to public anonymous so boot still resolves without private flash.
      if (isActive) {
        setState({ status: 'anonymous' })
      }
    })

    return () => {
      isActive = false
      unsubscribe()
      void startPromise.finally(() => {
        void controller.stop().catch(() => undefined)
      })
    }
  }, [controller])

  const signOut = useCallback(async () => {
    await controller.signOut(cleanup)
  }, [cleanup, controller])

  const value = useMemo(
    () => ({
      state,
      signOut,
    }),
    [signOut, state]
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
