import { Redirect } from 'expo-router'
import { AuthLoadingScreen } from '@/features/auth/AuthLoadingScreen'
import { resolveAuthEntryDestination } from '@/features/auth/auth-shell'
import { useAuthState } from '@/features/auth/session-provider'

export default function IndexRoute() {
  const state = useAuthState()
  const destination = resolveAuthEntryDestination(state)

  if (destination === null) {
    return <AuthLoadingScreen />
  }

  return <Redirect href={destination} />
}
