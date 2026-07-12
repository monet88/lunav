import { useMemo } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { ConfirmCallbackScreen } from '@/features/auth/ConfirmCallbackScreen'
import { buildConfirmRequestUrl } from '@/features/auth/confirm-request-url'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

function collectCodes(value: string | string[] | undefined): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string')
  }
  return []
}

/**
 * Local confirm deep-link target (lunav://auth/confirm?code=...).
 * Registered outside Stack.Protected so cold-start links still resolve.
 */
export default function AuthConfirmRoute() {
  const params = useLocalSearchParams<{ code?: string | string[] }>()
  const requestUrl = buildConfirmRequestUrl(collectCodes(params.code))

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
