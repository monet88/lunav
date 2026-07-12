import type { AuthState } from '@lunav/contracts'

export interface AuthStateSource {
  getState(): AuthState
  subscribe(listener: (state: AuthState) => void): () => void
}

export interface WaitForAuthStateOptions {
  timeoutMs?: number
}

/**
 * Resolve when the auth source publishes a state matching `predicate`.
 * Used after sign-in so navigation does not run before Stack.Protected can open.
 */
export function waitForAuthState(
  source: AuthStateSource,
  predicate: (state: AuthState) => boolean,
  options: WaitForAuthStateOptions = {}
): Promise<AuthState> {
  const timeoutMs = options.timeoutMs ?? 5_000
  const current = source.getState()

  if (predicate(current)) {
    return Promise.resolve(current)
  }

  return new Promise<AuthState>((resolve, reject) => {
    let settled = false
    // Nullable handles: subscribe may invoke the listener synchronously, so
    // finish must not close over const bindings still in the TDZ.
    let timer: ReturnType<typeof setTimeout> | undefined
    let unsubscribe: (() => void) | undefined

    const finish = (action: () => void): void => {
      if (settled) {
        return
      }

      settled = true
      if (timer !== undefined) {
        clearTimeout(timer)
      }
      unsubscribe?.()
      action()
    }

    unsubscribe = source.subscribe((nextState) => {
      if (predicate(nextState)) {
        finish(() => resolve(nextState))
      }
    })

    // Sync emission already settled the promise — skip timer and re-check.
    if (settled) {
      return
    }

    timer = setTimeout(() => {
      finish(() => reject(new Error('auth-state-timeout')))
    }, timeoutMs)

    // Re-check after subscribe in case the state flipped between getState and
    // listener attach (SIGNED_IN refresh can win the race).
    const latest = source.getState()
    if (predicate(latest)) {
      finish(() => resolve(latest))
    }
  })
}
