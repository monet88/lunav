import { useMemo } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { RecoveryCallbackScreen } from '@/features/auth/RecoveryCallbackScreen'
import { buildRecoveryRequestUrl } from '@/features/auth/confirm-request-url'
import { parseRecoverySearchParams } from '@/features/auth/search-params'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

/**
 * Local recovery deep-link target (lunav://auth/recovery?code=...).
 * Registered outside Stack.Protected so cold-start links still resolve.
 */
export default function AuthRecoveryRoute() {
  const params = useLocalSearchParams()
  const { codes } = parseRecoverySearchParams(params)
  const requestUrl = buildRecoveryRequestUrl(codes)

  const navigation = useMemo(
    () => ({
      replace: (path: string) => {
        router.replace(path as never)
      },
    }),
    []
  )

  return (
    <RecoveryCallbackScreen
      client={getSharedMobileSupabaseClient()}
      navigation={navigation}
      requestUrl={requestUrl}
    />
  )
}
