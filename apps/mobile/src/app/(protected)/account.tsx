import { router } from 'expo-router'
import {
  AccountScreen,
  type AccountScreenClient,
} from '@/features/account/AccountScreen'
import { asProfileClient } from '@/features/account/profile-client'
import { useMobileAuthSession } from '@/features/auth/session-provider'
import { getSharedMobileSupabaseClient } from '@/lib/supabase/shared-client'

/**
 * Protected account settings. Stack.Protected already requires confirmed
 * authenticated state before this route can mount.
 */
export default function ProtectedAccountRoute() {
  const session = useMobileAuthSession()
  // Shared client is the production Supabase adapter; narrow to the owner-scoped
  // profiles seam used by account load/update.
  const client: AccountScreenClient = asProfileClient(
    getSharedMobileSupabaseClient()
  )

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
