import { router } from 'expo-router'
import {
  AccountScreen,
  type AccountScreenClient,
} from '@/features/account/AccountScreen'
import { useMobileAuthSession } from '@/features/auth/session-provider'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

/**
 * Protected account settings. Stack.Protected already requires confirmed
 * authenticated state before this route can mount.
 */
export default function ProtectedAccountRoute() {
  const session = useMobileAuthSession()
  // Shared client is the production Supabase adapter; the account seam only
  // needs owner-scoped profiles read/write, not the full generated client type.
  const client = getSharedMobileSupabaseClient() as unknown as AccountScreenClient

  return (
    <AccountScreen
      authState={session.state}
      client={client}
      onNavigatePublic={() => {
        router.replace('/(auth)' as never)
      }}
      onSignOut={session.signOut}
    />
  )
}
