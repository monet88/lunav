import { useEffect } from 'react'
import { View } from 'react-native'
import { completeAuthCallback } from './auth-callback'
import { getOrCreateAuthCallbackWork } from './auth-callback-work'
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
 *
 * Work is keyed + shared across StrictMode remounts so a single-use confirm code
 * is exchanged once, while the latest active mount still receives the replace.
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
  useEffect(() => {
    let isActive = true
    // Key by URL + paths so StrictMode remount reuses the same single-use exchange.
    const workKey = `confirm\0${requestUrl ?? ''}\0${successPath}\0${failurePath}`

    const work = getOrCreateAuthCallbackWork(workKey, async () => {
      try {
        if (requestUrl === null || requestUrl.length === 0) {
          return failurePath
        }

        const result = await completeAuthCallback({
          client,
          expectedRedirectType: 'confirmation',
          requestUrl,
          successPath,
        })

        return result.kind === 'success' ? result.path : failurePath
      } catch {
        // Unexpected throws must still strip the code from history.
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
  }, [client, failurePath, navigation, requestUrl, successPath])

  return (
    <View testID="confirm-callback-screen">
      <AuthLoadingScreen message="Dang xac nhan email..." />
    </View>
  )
}
