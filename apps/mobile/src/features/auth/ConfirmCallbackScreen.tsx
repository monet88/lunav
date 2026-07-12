import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { completeAuthCallback } from './auth-callback'
import { AuthLoadingScreen } from './AuthLoadingScreen'

export type ConfirmCallbackNavigation = {
  replace: (path: string) => void
}

export interface ConfirmCallbackAuthClient {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{
      data: unknown
      error: unknown | null
    }>
    signOut: () => Promise<unknown>
  }
}

export interface ConfirmCallbackScreenProps {
  client: ConfirmCallbackAuthClient
  /**
   * Full deep-link URL including scheme/query. Must never be logged.
   */
  requestUrl: string | null
  navigation: ConfirmCallbackNavigation
  successPath?: string
  failurePath?: string
}

/**
 * Exchanges a single confirmation authorization code, then replaces navigation
 * so the callback credentials do not remain in history.
 */
export function ConfirmCallbackScreen({
  client,
  requestUrl,
  navigation,
  successPath = '/',
  // Outside Stack.Protected so cold-start failures remain reachable while the
  // public (auth) group is still gated by the loading session state.
  failurePath = '/auth/confirm-failed',
}: ConfirmCallbackScreenProps) {
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
        expectedRedirectType: 'confirmation',
        requestUrl,
        successPath,
      })

      if (!isActive) {
        return
      }

      // Always replace so the authorization code is stripped from history.
      navigation.replace(result.kind === 'success' ? result.path : failurePath)
    }

    void run()

    return () => {
      isActive = false
    }
  }, [client, failurePath, navigation, requestUrl, successPath])

  return (
    <View testID="confirm-callback-screen">
      <AuthLoadingScreen message="Dang xac nhan email..." />
    </View>
  )
}
