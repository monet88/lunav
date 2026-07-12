import { useEffect } from 'react'
import { View } from 'react-native'
import { completeAuthCallback } from './auth-callback'
import { getOrCreateAuthCallbackWork } from './auth-callback-work'
import { AuthLoadingScreen } from './AuthLoadingScreen'
import {
  setRecoverySession,
  type RecoverySessionStore,
} from './recovery-session'

export type RecoveryCallbackNavigation = {
  replace: (path: string) => void
}

export interface RecoveryCallbackAuthClient {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{
      data: unknown
      error: unknown | null
    }>
    signOut: () => Promise<unknown>
  }
}

export interface RecoveryCallbackScreenProps {
  client: RecoveryCallbackAuthClient
  /**
   * Full deep-link URL including scheme/query. Must never be logged.
   */
  requestUrl: string | null
  navigation: RecoveryCallbackNavigation
  successPath?: string
  failurePath?: string
  recoveryStore?: RecoverySessionStore
}

/**
 * Exchanges a single recovery authorization code, stores a mobile-owned recovery
 * proof, then replaces navigation so callback credentials do not remain in history.
 *
 * Work is keyed + shared across StrictMode remounts so a single-use recovery code
 * is exchanged once, while the latest active mount still receives the replace.
 */
export function RecoveryCallbackScreen({
  client,
  requestUrl,
  navigation,
  successPath = '/auth/reset-password',
  // Outside Stack.Protected so cold-start failures remain reachable while the
  // public (auth) group is still gated by the loading session state.
  failurePath = '/auth/recovery-failed',
  recoveryStore,
}: RecoveryCallbackScreenProps) {
  useEffect(() => {
    let isActive = true
    // Key by URL + paths so StrictMode remount reuses the same single-use exchange.
    const workKey = `recovery\0${requestUrl ?? ''}\0${successPath}\0${failurePath}`

    const work = getOrCreateAuthCallbackWork(workKey, async () => {
      try {
        if (requestUrl === null || requestUrl.length === 0) {
          return failurePath
        }

        const result = await completeAuthCallback({
          client,
          expectedRedirectType: 'recovery',
          requestUrl,
          successPath,
        })

        if (result.kind === 'success') {
          await setRecoverySession(result.userId, recoveryStore)
          return result.path
        }

        return failurePath
      } catch {
        // SecureStore / unexpected throws must still strip the code from history.
        return failurePath
      }
    })

    void work.then((path) => {
      if (isActive) {
        // Always replace so the authorization code is stripped from history.
        navigation.replace(path)
      }
    })

    return () => {
      isActive = false
    }
  }, [client, failurePath, navigation, recoveryStore, requestUrl, successPath])

  return (
    <View testID="recovery-callback-screen">
      <AuthLoadingScreen message="Dang xac thuc lien ket dat lai mat khau..." />
    </View>
  )
}
