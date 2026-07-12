import { Stack } from 'expo-router'
import { MobileAuthSessionProvider, useAuthState } from '@/features/auth/session-provider'
import {
  canAccessPrivateShell,
  canAccessPublicAuthShell,
} from '@/features/auth/auth-shell'

function RootNavigator() {
  const state = useAuthState()
  const isAuthenticated = canAccessPrivateShell(state)
  // Keep public routes unavailable only while loading so private content cannot
  // flash; once resolved, non-authenticated states share the public shell.
  const isPublicAuthAvailable = canAccessPublicAuthShell(state)

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isPublicAuthAvailable}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>

      {/* Always registered so lunav://auth/confirm cold-starts resolve. */}
      <Stack.Screen name="auth/confirm" />
      <Stack.Screen name="index" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <MobileAuthSessionProvider>
      <RootNavigator />
    </MobileAuthSessionProvider>
  )
}
