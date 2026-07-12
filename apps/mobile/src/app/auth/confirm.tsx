import { useMemo } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { ConfirmCallbackScreen } from '@/features/auth/ConfirmCallbackScreen'
import { buildConfirmRequestUrl } from '@/features/auth/confirm-request-url'
import { parseConfirmSearchParams } from '@/features/auth/search-params'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

/**
 * Local confirm deep-link target (lunav://auth/confirm?code=...).
 * Registered outside Stack.Protected so cold-start links still resolve.
 */
export default function AuthConfirmRoute() {
  const params = useLocalSearchParams()
  const { codes } = parseConfirmSearchParams(params)
  const requestUrl = buildConfirmRequestUrl(codes)

  const navigation = useMemo(
    () => ({
      replace: (path: string) => {
        router.replace(path as never)
      },
    }),
    []
  )

  return (
    <ConfirmCallbackScreen
      client={getSharedMobileSupabaseClient()}
      navigation={navigation}
      requestUrl={requestUrl}
    />
  )
}
