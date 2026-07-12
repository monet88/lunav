import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { completeAuthCallback } from './auth-callback'
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
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true
    let isActive = true

    const run = async () => {
      if (requestUrl === null || requestUrl.length === 0) {
        if (isActive) {
          navigation.replace(failurePath)
        }
        return
      }

      const result = await completeAuthCallback({
        client,
        expectedRedirectType: 'recovery',
        requestUrl,
        successPath,
      })

      if (!isActive) {
        return
      }

      if (result.kind === 'success') {
        await setRecoverySession(result.userId, recoveryStore)
        if (!isActive) {
          return
        }
        navigation.replace(result.path)
        return
      }

      // Always replace so the authorization code is stripped from history.
      navigation.replace(failurePath)
    }

    void run()

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
